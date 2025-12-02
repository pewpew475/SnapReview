from openai import OpenAI
import json

client = OpenAI(
  base_url="https://integrate.api.nvidia.com/v1",
  api_key="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"
)

completion = client.chat.completions.create(
  model="moonshotai/kimi-k2-instruct-0905",
  messages=[{"role":"user","content":""}],
  temperature=0.6,
  top_p=0.9,
  max_tokens=4096,
  stream=True
)


for chunk in completion:
  if chunk.choices[0].delta.content:
    print(chunk.choices[0].delta.content, end="")

