from typing import Annotated, TypedDict
import operator
from langgraph.graph import StateGraph, END
from langchain_ollama import OllamaLLM
import re

class TranslationState(TypedDict):
    original_text: str
    target_lang: str
    detected_format: str
    translated_text: str
    review_status: str
    attempts: int
    mode: str
    model: str

def format_detector(state: TranslationState):
    # Detect if text contains Markdown markers
    markdown_markers = [r'#+', r'\*\*', r'\*', r'\[.*\]\(.*\)', r'\n- ', r'\n\d\. ']
    is_markdown = any(re.search(marker, state['original_text']) for marker in markdown_markers)
    return {"detected_format": "markdown" if is_markdown else "text"}

def get_profile(mode: str):
    profiles = {
        "LITERAL": {
            "params": {"temperature": 0.1, "min_p": 0.01, "repeat_penalty": 1.2},
            "system": "Translate exactly, word for word when possible, maintaining strict technical terminology. If you need to reason, do it EXCLUSIVELY inside <think></think> tags."
        },
        "NATURAL": {
            "params": {"temperature": 0.4, "min_p": 0.05}, 
            "system": "Translate with natural fluency. Avoid linguistic calques and prioritize sounding like a native in the target language. If you need to reason, do it EXCLUSIVELY inside <think></think> tags."
        },
        "CREATIVO": {
            "params": {"temperature": 0.8, "min_p": 0.1, "mirostat": 2},
            "system": "Perform a transcreation. Adapt idioms, proverbs and emotional tone to fit perfectly in the target culture. If you need to reason, do it EXCLUSIVELY inside <think></think> tags."
        }
    }
    return profiles.get(mode, profiles["NATURAL"])

def translator(state: TranslationState):
    mode = state.get('mode', 'NATURAL')
    model = state.get('model', 'salamandra-ta-7b')
    
    profile = get_profile(mode)
    
    llm = OllamaLLM(
        model=model, 
        base_url="http://127.0.0.1:11434",
        keep_alive=300,
        system=(
            f"{profile['system']}\n"
            f"RULE: If you reason, do it INSIDE <think></think> tags. "
            f"Outside tags, write ONLY the final translation."
        ),
        **profile["params"]
    )
    
    # Map short codes
    lang_map = {"ESP": "Espanyol (Castellà)", "CAT": "Català", "ENG": "Anglès"}
    target = lang_map.get(state['target_lang'], state['target_lang'])
    
    # Combine system prompt with instructions
    full_prompt = f"Translate to {target}:\n{state['original_text']}"
    
    response = llm.invoke(full_prompt)
    return {"translated_text": response.strip(), "attempts": state.get('attempts', 0) + 1}

def reviewer(state: TranslationState):
    # Basic check for Markdown integrity
    input_markers = re.findall(r'[#\*\_\[\]\(\)]', state['original_text'])
    output_markers = re.findall(r'[#\*\_\[\]\(\)]', state['translated_text'])
    
    # If it's a markdown text, we expect some markers to be preserved.
    # This is a loose check because translation might change word count/line wrap.
    if state['detected_format'] == "markdown" and len(output_markers) < len(input_markers) * 0.7:
        return {"review_status": "failed"}
    
    return {"review_status": "passed"}

def should_retry(state: TranslationState):
    if state["review_status"] == "failed" and state["attempts"] < 3:
        return "translator"
    return END

# Build the graph
workflow = StateGraph(TranslationState)

workflow.add_node("detector", format_detector)
workflow.add_node("translator", translator)
workflow.add_node("reviewer", reviewer)

workflow.set_entry_point("detector")
workflow.add_edge("detector", "translator")
workflow.add_edge("translator", "reviewer")
workflow.add_conditional_edges("reviewer", should_retry, {"translator": "translator", END: END})

app_graph = workflow.compile()
