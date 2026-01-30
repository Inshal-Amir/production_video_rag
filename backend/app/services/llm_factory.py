from abc import ABC, abstractmethod
from openai import OpenAI
import os

class BaseLLM(ABC):
    @abstractmethod
    def get_vision_description(self, base64_image: str) -> str: pass
    @abstractmethod
    def get_embedding(self, text: str) -> list: pass
    @abstractmethod
    def check_intent(self, text: str) -> str: pass
    @abstractmethod
    def get_general_response(self, text: str) -> str: pass

class OpenAIProvider(BaseLLM):
    def __init__(self):
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    def get_vision_description(self, base64_image: str) -> str:
        response = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "user", "content": [
                    {"type": "text", "text": "Describe this frame in detail..."},
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
                ]}
            ],
            max_tokens=100
        )
        return response.choices[0].message.content

    def get_embedding(self, text: str) -> list:
        response = self.client.embeddings.create(
            input=text, model="text-embedding-3-small"
        )
        return response.data[0].embedding

    # --- NEW: Router Logic ---
    def check_intent(self, text: str) -> str:
        system_prompt = (
            "You are an intent classifier for a Video Security System. "
            "Analyze the user's input. "
            "If the user wants to find, see, search, or look for an object/event/person, return 'SEARCH'. "
            "If the user is greeting, asking your name, or asking general questions, return 'CHAT'. "
            "Output ONLY 'SEARCH' or 'CHAT'."
        )
        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": text}
                ],
                temperature=0.0
            )
            return response.choices[0].message.content.strip().upper()
        except:
            return "SEARCH"

    # --- NEW: General Chat Logic ---
    def get_general_response(self, text: str) -> str:
        system_prompt = (
            "You are the VideoRAG AI Assistant. "
            "Your job is to help users search through security footage. "
            "You can answer general questions, but strictly keep them brief. "
            "If the user asks something completely unrelated (like cooking recipes), politely steer them back to video search."
        )
        response = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": text}
            ]
        )
        return response.choices[0].message.content

def get_llm_provider():
    return OpenAIProvider()