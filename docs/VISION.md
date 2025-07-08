Vision fine-tuning
==================

Fine-tune models for better image understanding.

Vision fine-tuning uses image inputs for [supervised fine-tuning](/docs/guides/supervised-fine-tuning) to improve the model's understanding of image inputs. This guide will take you through this subset of SFT, and outline some of the important considerations for fine-tuning with image inputs.

  

||
|Provide image inputs for supervised fine-tuning to improve the model's understanding of image inputs.|Image classificationCorrecting failures in instruction following for complex prompts|gpt-4o-2024-08-06|

Data format
-----------

Just as you can [send one or many image inputs and create model responses based on them](/docs/guides/vision), you can include those same message types within your JSONL training data files. Images can be provided either as HTTP URLs or data URLs containing Base64-encoded images.

Here's an example of an image message on a line of your JSONL file. Below, the JSON object is expanded for readability, but typically this JSON would appear on a single line in your data file:

```json
{
  "messages": [
    {
      "role": "system",
      "content": "You are an assistant that identifies uncommon cheeses."
    },
    {
      "role": "user",
      "content": "What is this cheese?"
    },
    {
      "role": "user",
      "content": [
        {
          "type": "image_url",
          "image_url": {
            "url": "https://upload.wikimedia.org/wikipedia/commons/3/36/Danbo_Cheese.jpg"
          }
        }
      ]
    },
    {
      "role": "assistant",
      "content": "Danbo"
    }
  ]
}
```

Uploading training data for vision fine-tuning follows the [same process described here](/docs/guides/supervised-fine-tuning).

Image data requirements
-----------------------

#### Size

*   Your training file can contain a maximum of 50,000 examples that contain images (not including text examples).
*   Each example can have at most 10 images.
*   Each image can be at most 10 MB.

#### Format

*   Images must be JPEG, PNG, or WEBP format.
*   Your images must be in the RGB or RGBA image mode.
*   You cannot include images as output from messages with the `assistant` role.

#### Content moderation policy

We scan your images before training to ensure that they comply with our usage policy. This may introduce latency in file validation before fine-tuning begins.

Images containing the following will be excluded from your dataset and not used for training:

*   People
*   Faces
*   Children
*   CAPTCHAs

#### What to do if your images get skipped

Your images can get skipped during training for the following reasons:

*   **contains CAPTCHAs**, **contains people**, **contains faces**, **contains children**
    *   Remove the image. For now, we cannot fine-tune models with images containing these entities.
*   **inaccessible URL**
    *   Ensure that the image URL is publicly accessible.
*   **image too large**
    *   Please ensure that your images fall within our [dataset size limits](#size).
*   **invalid image format**
    *   Please ensure that your images fall within our [dataset format](#format).

Best practices
--------------

#### Reducing training cost

If you set the `detail` parameter for an image to `low`, the image is resized to 512 by 512 pixels and is only represented by 85 tokens regardless of its size. This will reduce the cost of training. [See here for more information.](/docs/guides/vision#low-or-high-fidelity-image-understanding)

```json
{
  "type": "image_url",
  "image_url": {
    "url": "https://upload.wikimedia.org/wikipedia/commons/3/36/Danbo_Cheese.jpg",
    "detail": "low"
  }
}
```

#### Control image quality

To control the fidelity of image understanding, set the `detail` parameter of `image_url` to `low`, `high`, or `auto` for each image. This will also affect the number of tokens per image that the model sees during training time, and will affect the cost of training. [See here for more information](/docs/guides/vision#low-or-high-fidelity-image-understanding).

Next steps
----------

Now that you know the basics of vision fine-tuning, explore these other methods as well.

[

Supervised fine-tuning

Fine-tune a model by providing correct outputs for sample inputs.

](/docs/guides/supervised-fine-tuning)[

Direct preference optimization

Fine-tune a model using direct preference optimization (DPO).

](/docs/guides/direct-preference-optimization)[

Reinforcement fine-tuning

Fine-tune a reasoning model by grading its outputs.

](/docs/guides/reinforcement-fine-tuning)

Was this page useful?





Text generation and prompting
=============================

Learn how to prompt a model to generate text.

With the OpenAI API, you can use a [large language model](/docs/models) to generate text from a prompt, as you might using [ChatGPT](https://chatgpt.com). Models can generate almost any kind of text response—like code, mathematical equations, structured JSON data, or human-like prose.

Here's a simple example using the [Responses API](/docs/api-reference/responses).

Generate text from a simple prompt

```javascript
import OpenAI from "openai";
const client = new OpenAI();

const response = await client.responses.create({
    model: "gpt-4.1",
    input: "Write a one-sentence bedtime story about a unicorn."
});

console.log(response.output_text);
```

```python
from openai import OpenAI
client = OpenAI()

response = client.responses.create(
    model="gpt-4.1",
    input="Write a one-sentence bedtime story about a unicorn."
)

print(response.output_text)
```

```bash
curl "https://api.openai.com/v1/responses" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $OPENAI_API_KEY" \
    -d '{
        "model": "gpt-4.1",
        "input": "Write a one-sentence bedtime story about a unicorn."
    }'
```

An array of content generated by the model is in the `output` property of the response. In this simple example, we have just one output which looks like this:

```json
[
    {
        "id": "msg_67b73f697ba4819183a15cc17d011509",
        "type": "message",
        "role": "assistant",
        "content": [
            {
                "type": "output_text",
                "text": "Under the soft glow of the moon, Luna the unicorn danced through fields of twinkling stardust, leaving trails of dreams for every child asleep.",
                "annotations": []
            }
        ]
    }
]
```

**The `output` array often has more than one item in it!** It can contain tool calls, data about reasoning tokens generated by [reasoning models](/docs/guides/reasoning), and other items. It is not safe to assume that the model's text output is present at `output[0].content[0].text`.

Some of our [official SDKs](/docs/libraries) include an `output_text` property on model responses for convenience, which aggregates all text outputs from the model into a single string. This may be useful as a shortcut to access text output from the model.

In addition to plain text, you can also have the model return structured data in JSON format - this feature is called [**Structured Outputs**](/docs/guides/structured-outputs).

Choosing a model
----------------

A key choice to make when generating content through the API is which model you want to use - the `model` parameter of the code samples above. [You can find a full listing of available models here](/docs/models). Here are a few factors to consider when choosing a model for text generation.

*   **[Reasoning models](/docs/guides/reasoning)** generate an internal chain of thought to analyze the input prompt, and excel at understanding complex tasks and multi-step planning. They are also generally slower and more expensive to use than GPT models.
*   **GPT models** are fast, cost-efficient, and highly intelligent, but benefit from more explicit instructions around how to accomplish tasks.
*   **Large and small (mini or nano) models** offer trade-offs for speed, cost, and intelligence. Large models are more effective at understanding prompts and solving problems across domains, while small models are generally faster and cheaper to use.

When in doubt, [`gpt-4.1`](/docs/models/gpt-4.1) offers a solid combination of intelligence, speed, and cost effectiveness.

Prompt engineering
------------------

**Prompt engineering** is the process of writing effective instructions for a model, such that it consistently generates content that meets your requirements.

Because the content generated from a model is non-deterministic, it is a combination of art and science to build a prompt that will generate content in the format you want. However, there are a number of techniques and best practices you can apply to consistently get good results from a model.

Some prompt engineering techniques will work with every model, like using message roles. But different model types (like reasoning versus GPT models) might need to be prompted differently to produce the best results. Even different snapshots of models within the same family could produce different results. So as you are building more complex applications, we strongly recommend that you:

*   Pin your production applications to specific [model snapshots](/docs/models) (like `gpt-4.1-2025-04-14` for example) to ensure consistent behavior.
*   Build [evals](/docs/guides/evals) that will measure the behavior of your prompts, so that you can monitor the performance of your prompts as you iterate on them, or when you change and upgrade model versions.

Now, let's examine some tools and techniques available to you to construct prompts.

Message roles and instruction following
---------------------------------------

You can provide instructions to the model with [differing levels of authority](https://model-spec.openai.com/2025-02-12.html#chain_of_command) using the `instructions` API parameter or **message roles**.

The `instructions` parameter gives the model high-level instructions on how it should behave while generating a response, including tone, goals, and examples of correct responses. Any instructions provided this way will take priority over a prompt in the `input` parameter.

Generate text with instructions

```javascript
import OpenAI from "openai";
const client = new OpenAI();

const response = await client.responses.create({
    model: "gpt-4.1",
    instructions: "Talk like a pirate.",
    input: "Are semicolons optional in JavaScript?",
});

console.log(response.output_text);
```

```python
from openai import OpenAI
client = OpenAI()

response = client.responses.create(
    model="gpt-4.1",
    instructions="Talk like a pirate.",
    input="Are semicolons optional in JavaScript?",
)

print(response.output_text)
```

```bash
curl "https://api.openai.com/v1/responses" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $OPENAI_API_KEY" \
    -d '{
        "model": "gpt-4.1",
        "instructions": "Talk like a pirate.",
        "input": "Are semicolons optional in JavaScript?"
    }'
```

The example above is roughly equivalent to using the following input messages in the `input` array:

Generate text with messages using different roles

```javascript
import OpenAI from "openai";
const client = new OpenAI();

const response = await client.responses.create({
    model: "gpt-4.1",
    input: [
        {
            role: "developer",
            content: "Talk like a pirate."
        },
        {
            role: "user",
            content: "Are semicolons optional in JavaScript?",
        },
    ],
});

console.log(response.output_text);
```

```python
from openai import OpenAI
client = OpenAI()

response = client.responses.create(
    model="gpt-4.1",
    input=[
        {
            "role": "developer",
            "content": "Talk like a pirate."
        },
        {
            "role": "user",
            "content": "Are semicolons optional in JavaScript?"
        }
    ]
)

print(response.output_text)
```

```bash
curl "https://api.openai.com/v1/responses" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $OPENAI_API_KEY" \
    -d '{
        "model": "gpt-4.1",
        "input": [
            {
                "role": "developer",
                "content": "Talk like a pirate."
            },
            {
                "role": "user",
                "content": "Are semicolons optional in JavaScript?"
            }
        ]
    }'
```

Note that the `instructions` parameter only applies to the current response generation request. If you are [managing conversation state](/docs/guides/conversation-state) with the `previous_response_id` parameter, the `instructions` used on previous turns will not be present in the context.

The [OpenAI model spec](https://model-spec.openai.com/2025-02-12.html#chain_of_command) describes how our models give different levels of priority to messages with different roles.

|developer|user|assistant|
|---|---|---|
|developer messages are instructions provided by the application developer, prioritized ahead of user messages.|user messages are instructions provided by an end user, prioritized behind developer messages.|Messages generated by the model have the assistant role.|

A multi-turn conversation may consist of several messages of these types, along with other content types provided by both you and the model. Learn more about [managing conversation state here](/docs/guides/conversation-state).

You could think about `developer` and `user` messages like a function and its arguments in a programming language.

*   `developer` messages provide the system's rules and business logic, like a function definition.
*   `user` messages provide inputs and configuration to which the `developer` message instructions are applied, like arguments to a function.

Reusable prompts
----------------

In the OpenAI dashboard, you can develop reusable [prompts](/playground/prompts) that you can use in API requests, rather than specifying the content of prompts in code. This way, you can more easily build and evaluate your prompts, and deploy improved versions of your prompts without changing your integration code.

Here's how it works:

1.  **Create a reusable prompt** in the [dashboard](/playground/prompts) with placeholders like `{{customer_name}}`.
2.  **Use the prompt** in your API request with the `prompt` parameter. The prompt parameter object has three properties you can configure:
    *   `id` — Unique identifier of your prompt, found in the dashboard
    *   `version` — A specific version of your prompt (defaults to the "current" version as specified in the dashboard)
    *   `variables` — A map of values to substitute in for variables in your prompt. The substitution values can either be strings, or other Response input message types like `input_image` or `input_file`. [See the full API reference](/docs/api-reference/responses/create).

String variables

Generate text with a prompt template

```javascript
import OpenAI from "openai";
const client = new OpenAI();

const response = await client.responses.create({
    model: "gpt-4.1",
    prompt: {
        id: "pmpt_abc123",
        version: "2",
        variables: {
            customer_name: "Jane Doe",
            product: "40oz juice box"
        }
    }
});

console.log(response.output_text);
```

```python
from openai import OpenAI
client = OpenAI()

response = client.responses.create(
    model="gpt-4.1",
    prompt={
        "id": "pmpt_abc123",
        "version": "2",
        "variables": {
            "customer_name": "Jane Doe",
            "product": "40oz juice box"
        }
    }
)

print(response.output_text)
```

```bash
curl https://api.openai.com/v1/responses \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4.1",
    "prompt": {
      "id": "pmpt_abc123",
      "version": "2",
      "variables": {
        "customer_name": "Jane Doe",
        "product": "40oz juice box"
      }
    }
  }'
```

Variables with file input

Prompt template with file input variable

```javascript
import fs from "fs";
import OpenAI from "openai";
const client = new OpenAI();

// Upload a PDF we will reference in the prompt variables
const file = await client.files.create({
    file: fs.createReadStream("draconomicon.pdf"),
    purpose: "user_data",
});

const response = await client.responses.create({
    model: "gpt-4.1",
    prompt: {
        id: "pmpt_abc123",
        variables: {
            topic: "Dragons",
            reference_pdf: {
                type: "input_file",
                file_id: file.id,
            },
        },
    },
});

console.log(response.output_text);
```

```python
import openai, pathlib

client = openai.OpenAI()

# Upload a PDF we will reference in the variables
file = client.files.create(
    file=open("draconomicon.pdf", "rb"),
    purpose="user_data",
)

response = client.responses.create(
    model="gpt-4.1",
    prompt={
        "id": "pmpt_abc123",
        "variables": {
            "topic": "Dragons",
            "reference_pdf": {
                "type": "input_file",
                "file_id": file.id,
            },
        },
    },
)

print(response.output_text)
```

```bash
# Assume you have already uploaded the PDF and obtained FILE_ID
curl https://api.openai.com/v1/responses   -H "Authorization: Bearer $OPENAI_API_KEY"   -H "Content-Type: application/json"   -d '{
    "model": "gpt-4.1",
    "prompt": {
      "id": "pmpt_abc123",
      "variables": {
        "topic": "Dragons",
        "reference_pdf": {
          "type": "input_file",
          "file_id": "file-abc123"
        }
      }
    }
  }'
```

Message formatting with Markdown and XML
----------------------------------------

When writing `developer` and `user` messages, you can help the model understand logical boundaries of your prompt and context data using a combination of [Markdown](https://commonmark.org/help/) formatting and [XML tags](https://www.w3.org/TR/xml/).

Markdown headers and lists can be helpful to mark distinct sections of a prompt, and to communicate hierarchy to the model. They can also potentially make your prompts more readable during development. XML tags can help delineate where one piece of content (like a supporting document used for reference) begins and ends. XML attributes can also be used to define metadata about content in the prompt that can be referenced by your instructions.

In general, a developer message will contain the following sections, usually in this order (though the exact optimal content and order may vary by which model you are using):

*   **Identity:** Describe the purpose, communication style, and high-level goals of the assistant.
*   **Instructions:** Provide guidance to the model on how to generate the response you want. What rules should it follow? What should the model do, and what should the model never do? This section could contain many subsections as relevant for your use case, like how the model should [call custom functions](/docs/guides/function-calling).
*   **Examples:** Provide examples of possible inputs, along with the desired output from the model.
*   **Context:** Give the model any additional information it might need to generate a response, like private/proprietary data outside its training data, or any other data you know will be particularly relevant. This content is usually best positioned near the end of your prompt, as you may include different context for different generation requests.

Below is an example of using Markdown and XML tags to construct a `developer` message with distinct sections and supporting examples.

Example prompt

A developer message for code generation

```text
# Identity

You are coding assistant that helps enforce the use of snake case 
variables in JavaScript code, and writing code that will run in 
Internet Explorer version 6.

# Instructions

* When defining variables, use snake case names (e.g. my_variable) 
  instead of camel case names (e.g. myVariable).
* To support old browsers, declare variables using the older 
  "var" keyword.
* Do not give responses with Markdown formatting, just return 
  the code as requested.

# Examples

<user_query>
How do I declare a string variable for a first name?
</user_query>

<assistant_response>
var first_name = "Anna";
</assistant_response>
```

API request

Send a prompt to generate code through the API

```javascript
import fs from "fs/promises";
import OpenAI from "openai";
const client = new OpenAI();

const instructions = await fs.readFile("prompt.txt", "utf-8");

const response = await client.responses.create({
    model: "gpt-4.1",
    instructions,
    input: "How would I declare a variable for a last name?",
});

console.log(response.output_text);
```

```python
from openai import OpenAI
client = OpenAI()

with open("prompt.txt", "r", encoding="utf-8") as f:
    instructions = f.read()

response = client.responses.create(
    model="gpt-4.1",
    instructions=instructions,
    input="How would I declare a variable for a last name?",
)

print(response.output_text)
```

```bash
curl https://api.openai.com/v1/responses \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4.1",
    "instructions": "'"$(< prompt.txt)"'",
    "input": "How would I declare a variable for a last name?"
  }'
```

#### Save on cost and latency with prompt caching

When constructing a message, you should try and keep content that you expect to use over and over in your API requests at the beginning of your prompt, **and** among the first API parameters you pass in the JSON request body to [Chat Completions](/docs/api-reference/chat) or [Responses](/docs/api-reference/responses). This enables you to maximize cost and latency savings from [prompt caching](/docs/guides/prompt-caching).

Few-shot learning
-----------------

Few-shot learning lets you steer a large language model toward a new task by including a handful of input/output examples in the prompt, rather than [fine-tuning](/docs/guides/model-optimization) the model. The model implicitly "picks up" the pattern from those examples and applies it to a prompt. When providing examples, try to show a diverse range of possible inputs with the desired outputs.

Typically, you will provide examples as part of a `developer` message in your API request. Here's an example `developer` message containing examples that show a model how to classify positive or negative customer service reviews.

```text
# Identity

You are a helpful assistant that labels short product reviews as
Positive, Negative, or Neutral.

# Instructions

* Only output a single word in your response with no additional formatting
  or commentary.
* Your response should only be one of the words "Positive", "Negative", or
  "Neutral" depending on the sentiment of the product review you are given.

# Examples

<product_review id="example-1">
I absolutely love this headphones — sound quality is amazing!
</product_review>

<assistant_response id="example-1">
Positive
</assistant_response>

<product_review id="example-2">
Battery life is okay, but the ear pads feel cheap.
</product_review>

<assistant_response id="example-2">
Neutral
</assistant_response>

<product_review id="example-3">
Terrible customer service, I'll never buy from them again.
</product_review>

<assistant_response id="example-3">
Negative
</assistant_response>
```

Include relevant context information
------------------------------------

It is often useful to include additional context information the model can use to generate a response within the prompt you give the model. There are a few common reasons why you might do this:

*   To give the model access to proprietary data, or any other data outside the data set the model was trained on.
*   To constrain the model's response to a specific set of resources that you have determined will be most beneficial.

The technique of adding additional relevant context to the model generation request is sometimes called **retrieval-augmented generation (RAG)**. You can add additional context to the prompt in many different ways, from querying a vector database and including the text you get back into a prompt, or by using OpenAI's built-in [file search tool](/docs/guides/tools-file-search) to generate content based on uploaded documents.

#### Planning for the context window

Models can only handle so much data within the context they consider during a generation request. This memory limit is called a **context window**, which is defined in terms of [tokens](https://blogs.nvidia.com/blog/ai-tokens-explained) (chunks of data you pass in, from text to images).

Models have different context window sizes from the low 100k range up to one million tokens for newer GPT-4.1 models. [Refer to the model docs](/docs/models) for specific context window sizes per model.

Prompting GPT-4.1 models
------------------------

GPT models like [`gpt-4.1`](/docs/models/gpt-4.1) benefit from precise instructions that explicitly provide the logic and data required to complete the task in the prompt. GPT-4.1 in particular is highly steerable and responsive to well-specified prompts. To get the most out of GPT-4.1, refer to the prompting guide in the cookbook.

[

GPT-4.1 prompting guide

Get the most out of prompting GPT-4.1 with the tips and tricks in this prompting guide, extracted from real-world use cases and practical experience.

](https://cookbook.openai.com/examples/gpt4-1_prompting_guide)

#### GPT-4.1 prompting best practices

While the [cookbook](https://cookbook.openai.com/examples/gpt4-1_prompting_guide) has the best and most comprehensive guidance for prompting this model, here are a few best practices to keep in mind.

Building agentic workflows

### System Prompt Reminders

In order to best utilize the agentic capabilities of GPT-4.1, we recommend including three key types of reminders in all agent prompts for persistence, tool calling, and planning. As a whole, we find that these three instructions transform the model's behavior from chatbot-like into a much more "eager" agent, driving the interaction forward autonomously and independently. Here are a few examples:

```text
## PERSISTENCE
You are an agent - please keep going until the user's query is completely
resolved, before ending your turn and yielding back to the user. Only
terminate your turn when you are sure that the problem is solved.

## TOOL CALLING
If you are not sure about file content or codebase structure pertaining to
the user's request, use your tools to read files and gather the relevant
information: do NOT guess or make up an answer.

## PLANNING
You MUST plan extensively before each function call, and reflect
extensively on the outcomes of the previous function calls. DO NOT do this
entire process by making function calls only, as this can impair your
ability to solve the problem and think insightfully.
```

#### Tool Calls

Compared to previous models, GPT-4.1 has undergone more training on effectively utilizing tools passed as arguments in an OpenAI API request. We encourage developers to exclusively use the tools field of API requests to pass tools for best understanding and performance, rather than manually injecting tool descriptions into the system prompt and writing a separate parser for tool calls, as some have reported doing in the past.

#### Diff Generation

Correct diffs are critical for coding applications, so we've significantly improved performance at this task for GPT-4.1. In our cookbook, we open-source a recommended diff format on which GPT-4.1 has been extensively trained. That said, the model should generalize to any well-specified format.

Using long context

GPT-4.1 has a performant 1M token input context window, and will be useful for a variety of long context tasks, including structured document parsing, re-ranking, selecting relevant information while ignoring irrelevant context, and performing multi-hop reasoning using context.

#### Optimal Context Size

We show perfect performance at needle-in-a-haystack evals up to our full context size, and we've observed very strong performance at complex tasks with a mix of relevant and irrelevant code and documents in the range of hundreds of thousands of tokens.

#### Delimiters

We tested a variety of delimiters for separating context provided to the model against our long context evals. Briefly, XML and the format demonstrated by Lee et al. ([ref](https://arxiv.org/pdf/2406.13121)) tend to perform well, while JSON performed worse for this task. See our cookbook for prompt examples.

#### Prompt Organization

Especially in long context usage, placement of instructions and context can substantially impact performance. In our experiments, we found that it was optimal to put critical instructions, including the user query, at both the top and the bottom of the prompt; this elicited marginally better performance from the model than putting them only at the top, and much better performance than only at the bottom.

Prompting for chain of thought

As mentioned above, GPT-4.1 isn't a reasoning model, but prompting the model to think step by step (called "chain of thought") can be an effective way for a model to break down problems into more manageable pieces. The model has been trained to perform well at agentic reasoning and real-world problem solving, so it shouldn't require much prompting to do well.

We recommend starting with this basic chain-of-thought instruction at the end of your prompt:

```text
First, think carefully step by step about what documents are needed to answer the query. Then, print out the TITLE and ID of each document. Then, format the IDs into a list.
```

From there, you should improve your CoT prompt by auditing failures in your particular examples and evals, and addressing systematic planning and reasoning errors with more explicit instructions. See our cookbook for a prompt example demonstrating a more opinionated reasoning strategy.

Instruction following

GPT-4.1 exhibits outstanding instruction-following performance, which developers can leverage to precisely shape and control the outputs for their particular use cases. However, since the model follows instructions more literally than its predecessors, may need to provide more explicit specification around what to do or not do, and existing prompts optimized for other models may not immediately work with this model.

#### Recommended Workflow

Here is our recommended workflow for developing and debugging instructions in prompts:

*   Start with an overall "Response Rules" or "Instructions" section with high-level guidance and bullet points.
*   If you'd like to change a more specific behavior, add a section containing more details for that category, like `## Sample Phrases`.
*   If there are specific steps you'd like the model to follow in its workflow, add an ordered list and instruct the model to follow these steps.
*   If behavior still isn't working as expected, check for conflicting, underspecified, or incorrect instructions and examples. If there are conflicting instructions, GPT-4.1 tends to follow the one closer to the end of the prompt.
*   Add examples that demonstrate desired behavior; ensure that any important behavior demonstrated in your examples are also cited in your rules.
*   It's generally not necessary to use all-caps or other incentives like bribes or tips, but developers can experiment with this for extra emphasis if so desired.

#### Common Failure Modes

These failure modes are not unique to GPT-4.1, but we share them here for general awareness and ease of debugging.

*   Instructing a model to always follow a specific behavior can occasionally induce adverse effects. For instance, if told "you must call a tool before responding to the user," models may hallucinate tool inputs or call the tool with null values if they do not have enough information. Adding "if you don't have enough information to call the tool, ask the user for the information you need" should mitigate this.
*   When provided sample phrases, models can use those quotes verbatim and start to sound repetitive to users. Ensure you instruct the model to vary them as necessary.
*   Without specific instructions, some models can be eager to provide additional prose to explain their decisions, or output more formatting in responses than may be desired. Provide instructions and potentially examples to help mitigate.

See our cookbook for an example customer service prompt that demonstrates these principles.

Prompting reasoning models
--------------------------

There are some differences to consider when prompting a [reasoning model](/docs/guides/reasoning) versus prompting a GPT model. Generally speaking, reasoning models will provide better results on tasks with only high-level guidance. This differs from GPT models, which benefit from very precise instructions.

You could think about the difference between reasoning and GPT models like this.

*   A reasoning model is like a senior co-worker. You can give them a goal to achieve and trust them to work out the details.
*   A GPT model is like a junior coworker. They'll perform best with explicit instructions to create a specific output.

For more information on best practices when using reasoning models, [refer to this guide](/docs/guides/reasoning-best-practices).

Next steps
----------

Now that you known the basics of text inputs and outputs, you might want to check out one of these resources next.

[

Build a prompt in the Playground

Use the Playground to develop and iterate on prompts.

](/playground)[

Generate JSON data with Structured Outputs

Ensure JSON data emitted from a model conforms to a JSON schema.

](/docs/guides/structured-outputs)[

Full API reference

Check out all the options for text generation in the API reference.

](/docs/api-reference/responses)

Was this page useful? agora crie um arquivo markedown para esse 




Images and vision
=================

Learn how to understand or generate images.

Overview
--------

[

![Create images](https://cdn.openai.com/API/docs/images/images.png)

Create images

Use GPT Image or DALL·E to generate or edit images.

](/docs/guides/image-generation)[

![Process image inputs](https://cdn.openai.com/API/docs/images/vision.png)

Process image inputs

Use our models' vision capabilities to analyze images.

](/docs/guides/images-vision#analyze-images)

In this guide, you will learn about building applications involving images with the OpenAI API. If you know what you want to build, find your use case below to get started. If you're not sure where to start, continue reading to get an overview.

### A tour of image-related use cases

Recent language models can process image inputs and analyze them — a capability known as **vision**. With `gpt-image-1`, they can both analyze visual inputs and create images.

The OpenAI API offers several endpoints to process images as input or generate them as output, enabling you to build powerful multimodal applications.

|API|Supported use cases|
|---|---|
|Responses API|Analyze images and use them as input and/or generate images as output|
|Images API|Generate images as output, optionally using images as input|
|Chat Completions API|Analyze images and use them as input to generate text or audio|

To learn more about the input and output modalities supported by our models, refer to our [models page](/docs/models).

Generate or edit images
-----------------------

You can generate or edit images using the Image API or the Responses API.

Our latest image generation model, `gpt-image-1`, is a natively multimodal large language model. It can understand text and images and leverage its broad world knowledge to generate images with better instruction following and contextual awareness.

In contrast, we also offer specialized image generation models - DALL·E 2 and 3 - which don't have the same inherent understanding of the world as GPT Image.

Generate images with Responses

```javascript
import OpenAI from "openai";
const openai = new OpenAI();

const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: "Generate an image of gray tabby cat hugging an otter with an orange scarf",
    tools: [{type: "image_generation"}],
});

// Save the image to a file
const imageData = response.output
  .filter((output) => output.type === "image_generation_call")
  .map((output) => output.result);

if (imageData.length > 0) {
  const imageBase64 = imageData[0];
  const fs = await import("fs");
  fs.writeFileSync("cat_and_otter.png", Buffer.from(imageBase64, "base64"));
}
```

```python
from openai import OpenAI
import base64

client = OpenAI() 

response = client.responses.create(
    model="gpt-4.1-mini",
    input="Generate an image of gray tabby cat hugging an otter with an orange scarf",
    tools=[{"type": "image_generation"}],
)

// Save the image to a file
image_data = [
    output.result
    for output in response.output
    if output.type == "image_generation_call"
]

if image_data:
    image_base64 = image_data[0]
    with open("cat_and_otter.png", "wb") as f:
        f.write(base64.b64decode(image_base64))
```

You can learn more about image generation in our [Image generation](/docs/guides/image-generation) guide.

### Using world knowledge for image generation

The difference between DALL·E models and GPT Image is that a natively multimodal language model can use its visual understanding of the world to generate lifelike images including real-life details without a reference.

For example, if you prompt GPT Image to generate an image of a glass cabinet with the most popular semi-precious stones, the model knows enough to select gemstones like amethyst, rose quartz, jade, etc, and depict them in a realistic way.

Analyze images
--------------

**Vision** is the ability for a model to "see" and understand images. If there is text in an image, the model can also understand the text. It can understand most visual elements, including objects, shapes, colors, and textures, even if there are some [limitations](#limitations).

### Giving a model images as input

You can provide images as input to generation requests in multiple ways:

*   By providing a fully qualified URL to an image file
*   By providing an image as a Base64-encoded data URL
*   By providing a file ID (created with the [Files API](/docs/api-reference/files))

You can provide multiple images as input in a single request by including multiple images in the `content` array, but keep in mind that [images count as tokens](#calculating-costs) and will be billed accordingly.

Passing a URL

Analyze the content of an image

```javascript
import OpenAI from "openai";

const openai = new OpenAI();

const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: [{
        role: "user",
        content: [
            { type: "input_text", text: "what's in this image?" },
            {
                type: "input_image",
                image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg",
            },
        ],
    }],
});

console.log(response.output_text);
```

```python
from openai import OpenAI

client = OpenAI()

response = client.responses.create(
    model="gpt-4.1-mini",
    input=[{
        "role": "user",
        "content": [
            {"type": "input_text", "text": "what's in this image?"},
            {
                "type": "input_image",
                "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg",
            },
        ],
    }],
)

print(response.output_text)
```

```bash
curl https://api.openai.com/v1/responses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{
    "model": "gpt-4.1-mini",
    "input": [
      {
        "role": "user",
        "content": [
          {"type": "input_text", "text": "what is in this image?"},
          {
            "type": "input_image",
            "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg"
          }
        ]
      }
    ]
  }'
```

Passing a Base64 encoded image

Analyze the content of an image

```javascript
import fs from "fs";
import OpenAI from "openai";

const openai = new OpenAI();

const imagePath = "path_to_your_image.jpg";
const base64Image = fs.readFileSync(imagePath, "base64");

const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: [
        {
            role: "user",
            content: [
                { type: "input_text", text: "what's in this image?" },
                {
                    type: "input_image",
                    image_url: `data:image/jpeg;base64,${base64Image}`,
                },
            ],
        },
    ],
});

console.log(response.output_text);
```

```python
import base64
from openai import OpenAI

client = OpenAI()

# Function to encode the image
def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")

# Path to your image
image_path = "path_to_your_image.jpg"

# Getting the Base64 string
base64_image = encode_image(image_path)

response = client.responses.create(
    model="gpt-4.1",
    input=[
        {
            "role": "user",
            "content": [
                { "type": "input_text", "text": "what's in this image?" },
                {
                    "type": "input_image",
                    "image_url": f"data:image/jpeg;base64,{base64_image}",
                },
            ],
        }
    ],
)

print(response.output_text)
```

Passing a file ID

Analyze the content of an image

```javascript
import OpenAI from "openai";
import fs from "fs";

const openai = new OpenAI();

// Function to create a file with the Files API
async function createFile(filePath) {
  const fileContent = fs.createReadStream(filePath);
  const result = await openai.files.create({
    file: fileContent,
    purpose: "vision",
  });
  return result.id;
}

// Getting the file ID
const fileId = await createFile("path_to_your_image.jpg");

const response = await openai.responses.create({
  model: "gpt-4.1-mini",
  input: [
    {
      role: "user",
      content: [
        { type: "input_text", text: "what's in this image?" },
        {
          type: "input_image",
          file_id: fileId,
        },
      ],
    },
  ],
});

console.log(response.output_text);
```

```python
from openai import OpenAI

client = OpenAI()

# Function to create a file with the Files API
def create_file(file_path):
  with open(file_path, "rb") as file_content:
    result = client.files.create(
        file=file_content,
        purpose="vision",
    )
    return result.id

# Getting the file ID
file_id = create_file("path_to_your_image.jpg")

response = client.responses.create(
    model="gpt-4.1-mini",
    input=[{
        "role": "user",
        "content": [
            {"type": "input_text", "text": "what's in this image?"},
            {
                "type": "input_image",
                "file_id": file_id,
            },
        ],
    }],
)

print(response.output_text)
```

### Image input requirements

Input images must meet the following requirements to be used in the API.

|Supported file types|PNG (.png)JPEG (.jpeg and .jpg)WEBP (.webp)Non-animated GIF (.gif)|
|Size limits|Up to 50 MB total payload size per requestUp to 500 individual image inputs per request|
|Other requirements|No watermarks or logosNo NSFW contentClear enough for a human to understand|

### Specify image input detail level

The `detail` parameter tells the model what level of detail to use when processing and understanding the image (`low`, `high`, or `auto` to let the model decide). If you skip the parameter, the model will use `auto`.

```plain
{
    "type": "input_image",
    "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg",
    "detail": "high"
}
```

You can save tokens and speed up responses by using `"detail": "low"`. This lets the model process the image with a budget of 85 tokens. The model receives a low-resolution 512px x 512px version of the image. This is fine if your use case doesn't require the model to see with high-resolution detail (for example, if you're asking about the dominant shape or color in the image).

On the other hand, you can use `"detail": "high"` if you want the model to have a better understanding of the image.

Read more about calculating image processing costs in the [Calculating costs](#calculating-costs) section below.

Limitations
-----------

While models with vision capabilities are powerful and can be used in many situations, it's important to understand the limitations of these models. Here are some known limitations:

*   **Medical images**: The model is not suitable for interpreting specialized medical images like CT scans and shouldn't be used for medical advice.
*   **Non-English**: The model may not perform optimally when handling images with text of non-Latin alphabets, such as Japanese or Korean.
*   **Small text**: Enlarge text within the image to improve readability, but avoid cropping important details.
*   **Rotation**: The model may misinterpret rotated or upside-down text and images.
*   **Visual elements**: The model may struggle to understand graphs or text where colors or styles—like solid, dashed, or dotted lines—vary.
*   **Spatial reasoning**: The model struggles with tasks requiring precise spatial localization, such as identifying chess positions.
*   **Accuracy**: The model may generate incorrect descriptions or captions in certain scenarios.
*   **Image shape**: The model struggles with panoramic and fisheye images.
*   **Metadata and resizing**: The model doesn't process original file names or metadata, and images are resized before analysis, affecting their original dimensions.
*   **Counting**: The model may give approximate counts for objects in images.
*   **CAPTCHAS**: For safety reasons, our system blocks the submission of CAPTCHAs.

Calculating costs
-----------------

Image inputs are metered and charged in tokens, just as text inputs are. How images are converted to text token inputs varies based on the model. You can find a vision pricing calculator in the FAQ section of the [pricing page](https://openai.com/api/pricing/).

### GPT-4.1-mini, GPT-4.1-nano, o4-mini

Image inputs are metered and charged in tokens based on their dimensions. The token cost of an image is determined as follows:

*   Calculate the number of 32px x 32px patches that are needed to fully cover the image
*   If the number of patches exceeds 1536, we scale down the image so that it can be covered by no more than 1536 patches
*   The token cost is the number of patches, capped at a maximum of 1536 tokens
*   For `gpt-4.1-mini` we multiply image tokens by 1.62 to get total tokens, for `gpt-4.1-nano` we multiply image tokens by 2.46 to get total tokens, and for `o4-mini` we multiply image tokens by 1.72 to get total tokens, that are then billed at normal text token rates.

Note:

**Cost calculation examples**

*   A 1024 x 1024 image is **1024 tokens**
    *   Width is 1024, resulting in `(1024 + 32 - 1) // 32 = 32` patches
    *   Height is 1024, resulting in `(1024 + 32 - 1) // 32 = 32` patches
    *   Tokens calculated as `32 * 32 = 1024`, below the cap of 1536
*   A 1800 x 2400 image is **1452 tokens**
    *   Width is 1800, resulting in `(1800 + 32 - 1) // 32 = 57` patches
    *   Height is 2400, resulting in `(2400 + 32 - 1) // 32 = 75` patches
    *   We need `57 * 75 = 4275` patches to cover the full image. Since that exceeds 1536, we need to scale down the image while preserving the aspect ratio.
    *   We can calculate the shrink factor as `sqrt(token_budget × patch_size^2 / (width * height))`. In our example, the shrink factor is `sqrt(1536 * 32^2 / (1800 * 2400)) = 0.603`.
    *   Width is now 1086, resulting in `1086 / 32 = 33.94` patches
    *   Height is now 1448, resulting in `1448 / 32 = 45.25` patches
    *   We want to make sure the image fits in a whole number of patches. In this case we scale again by `33 / 33.94 = 0.97` to fit the width in 33 patches.
    *   The final width is then `1086 * (33 / 33.94) = 1056)` and the final height is `1448 * (33 / 33.94) = 1408`
    *   The image now requires `1056 / 32 = 33` patches to cover the width and `1408 / 32 = 44` patches to cover the height
    *   The total number of tokens is the `33 * 44 = 1452`, below the cap of 1536

### GPT 4o, GPT-4.1, GPT-4o-mini, CUA, and o-series (except o4-mini)

The token cost of an image is determined by two factors: size and detail.

Any image with `"detail": "low"` costs a set, base number of tokens. This amount varies by model (see charte below). To calculate the cost of an image with `"detail": "high"`, we do the following:

*   Scale to fit in a 2048px x 2048px square, maintaining original aspect ratio
*   Scale so that the image's shortest side is 768px long
*   Count the number of 512px squares in the image—each square costs a set amount of tokens (see chart below)
*   Add the base tokens to the total

|Model|Base tokens|Tile tokens|
|---|---|---|
|4o, 4.1, 4.5|85|170|
|4o-mini|2833|5667|
|o1, o1-pro, o3|75|150|
|computer-use-preview|65|129|

**Cost calculation examples (for gpt-4o)**

*   A 1024 x 1024 square image in `"detail": "high"` mode costs 765 tokens
    *   1024 is less than 2048, so there is no initial resize.
    *   The shortest side is 1024, so we scale the image down to 768 x 768.
    *   4 512px square tiles are needed to represent the image, so the final token cost is `170 * 4 + 85 = 765`.
*   A 2048 x 4096 image in `"detail": "high"` mode costs 1105 tokens
    *   We scale down the image to 1024 x 2048 to fit within the 2048 square.
    *   The shortest side is 1024, so we further scale down to 768 x 1536.
    *   6 512px tiles are needed, so the final token cost is `170 * 6 + 85 = 1105`.
*   A 4096 x 8192 image in `"detail": "low"` most costs 85 tokens
    *   Regardless of input size, low detail images are a fixed cost.

### GPT Image 1

For GPT Image 1, we calculate the cost of an image input the same way as described above, except that we scale down the image so that the shortest side is 512px instead of 768px. There is no detail level configuration for this model, so the price depends on the dimensions of the image.

The base cost is 65 image tokens, and each tile costs 129 image tokens.

To see pricing for image input tokens, refer to our [pricing page](/docs/pricing#latest-models).

* * *

We process images at the token level, so each image we process counts towards your tokens per minute (TPM) limit.

For the most precise and up-to-date estimates for image processing, please use our image pricing calculator available [here](https://openai.com/api/pricing/).

Was this page useful?   crie um arquivo markdown com esse documento 


Direct preference optimization
==============================

Fine-tune models for subjective decision-making by comparing model outputs.

[Direct Preference Optimization](https://arxiv.org/abs/2305.18290) (DPO) fine-tuning allows you to fine-tune models based on prompts and pairs of responses. This approach enables the model to learn from more subjective human preferences, optimizing for outputs that are more likely to be favored. DPO is currently only supported for text inputs and outputs.

  

||
|Provide both a correct and incorrect example response for a prompt. Indicate the correct response to help the model perform better.|Summarizing text, focusing on the right thingsGenerating chat messages with the right tone and style|gpt-4.1-2025-04-14 gpt-4.1-mini-2025-04-14 gpt-4.1-nano-2025-04-14|

Data format
-----------

Each example in your dataset should contain:

*   A prompt, like a user message.
*   A preferred output (an ideal assistant response).
*   A non-preferred output (a suboptimal assistant response).

The data should be formatted in JSONL format, with each line [representing an example](/docs/api-reference/fine-tuning/preference-input) in the following structure:

```json
{
  "input": {
    "messages": [
      {
        "role": "user",
        "content": "Hello, can you tell me how cold San Francisco is today?"
      }
    ],
    "tools": [],
    "parallel_tool_calls": true
  },
  "preferred_output": [
    {
      "role": "assistant",
      "content": "Today in San Francisco, it is not quite cold as expected. Morning clouds will give away to sunshine, with a high near 68°F (20°C) and a low around 57°F (14°C)."
    }
  ],
  "non_preferred_output": [
    {
      "role": "assistant",
      "content": "It is not particularly cold in San Francisco today."
    }
  ]
}
```

Currently, we only train on one-turn conversations for each example, where the preferred and non-preferred messages need to be the last assistant message.

Create a DPO fine-tune job
--------------------------

Uploading training data and using a model fine-tuned with DPO follows the [same flow described here](/docs/guides/model-optimization).

To create a DPO fine-tune job, use the `method` field in the [fine-tuning job creation endpoint](/docs/api-reference/fine-tuning/create), where you can specify `type` as well as any associated `hyperparameters`. For DPO:

*   set the `type` parameter to `dpo`
*   optionally set the `hyperparameters` property with any options you'd like to configure.

The `beta` hyperparameter is a new option that is only available for DPO. It's a floating point number between `0` and `2` that controls how strictly the new model will adhere to its previous behavior, versus aligning with the provided preferences. A high number will be more conservative (favoring previous behavior), and a lower number will be more aggressive (favor the newly provided preferences more often).

You can also set this value to `auto` (the default) to use a value configured by the platform.

The example below shows how to configure a DPO fine-tuning job using the OpenAI SDK.

Create a fine-tuning job with DPO

```javascript
import OpenAI from "openai";

const openai = new OpenAI();

const job = await openai.fineTuning.jobs.create({
  training_file: "file-all-about-the-weather",
  model: "gpt-4o-2024-08-06",
  method: {
    type: "dpo",
    dpo: {
      hyperparameters: { beta: 0.1 },
    },
  },
});
```

```python
from openai import OpenAI

client = OpenAI()

job = client.fine_tuning.jobs.create(
    training_file="file-all-about-the-weather",
    model="gpt-4o-2024-08-06",
    method={
        "type": "dpo",
        "dpo": {
            "hyperparameters": {"beta": 0.1},
        },
    },
)
```

Use SFT and DPO together
------------------------

Currently, OpenAI offers [supervised fine-tuning (SFT)](/docs/guides/supervised-fine-tuning) as the default method for fine-tuning jobs. Performing SFT on your preferred responses (or a subset) before running another DPO job afterwards can significantly enhance model alignment and performance. By first fine-tuning the model on the desired responses, it can better identify correct patterns, providing a strong foundation for DPO to refine behavior.

A recommended workflow is as follows:

1.  Fine-tune the base model with SFT using a subset of your preferred responses. Focus on ensuring the data quality and representativeness of the tasks.
2.  Use the SFT fine-tuned model as the starting point, and apply DPO to adjust the model based on preference comparisons.

Next steps
----------

Now that you know the basics of DPO, explore these other methods as well.

[

Supervised fine-tuning

Fine-tune a model by providing correct outputs for sample inputs.

](/docs/guides/supervised-fine-tuning)[

Vision fine-tuning

Learn to fine-tune for computer vision with image inputs.

](/docs/guides/vision-fine-tuning)[

Reinforcement fine-tuning

Fine-tune a reasoning model by grading its outputs.

](/docs/guides/reinforcement-fine-tuning)

Was this page useful?


Reinforcement fine-tuning
=========================

Fine-tune models for expert-level performance within a domain.

Reinforcement fine-tuning (RFT) adapts an OpenAI reasoning model with a feedback signal you define. Like [supervised fine-tuning](/docs/guides/supervised-fine-tuning), it tailors the model to your task. The difference is that instead of training on fixed “correct” answers, it relies on a programmable grader that scores every candidate response. The training algorithm then shifts the model’s weights, so high-scoring outputs become more likely and low-scoring ones fade.

  

||
|Generate a response for a prompt, provide an expert grade for the result, and reinforce the model's chain-of-thought for higher-scored responses.Requires expert graders to agree on the ideal output from the model.|Complex domain-specific tasks that require advanced reasoningMedical diagnoses based on history and diagnostic guidelinesDetermining relevant passages from legal case law|o4-mini-2025-04-16Reasoning models only.|

This optimization lets you align the model with nuanced objectives like style, safety, or domain accuracy—with many [practical use cases](/docs/guides/rft-use-cases) emerging. Run RFT in five steps:

1.  Implement a [grader](/docs/guides/graders) that assigns a numeric reward to each model response.
2.  Upload your prompt dataset and designate a validation split.
3.  Start the fine-tune job.
4.  Monitor and [evaluate](/docs/guides/evals) checkpoints; revise data or grader if needed.
5.  Deploy the resulting model through the standard API.

During training, the platform cycles through the dataset, samples several responses per prompt, scores them with the grader, and applies policy-gradient updates based on those rewards. The loop continues until we hit the end of your training data or you stop the job at a chosen checkpoint, producing a model optimized for the metric that matters to you.

When should I use reinforcement fine-tuning?

It's useful to understand the strengths and weaknesses of reinforcement fine-tuning to identify opportunities and to avoid wasted effort.

*   **RFT works best with unambiguous tasks**. Check whether qualified human experts agree on the answers. If conscientious experts working independently (with access only to the same instructions and information as the model) do not converge on the same answers, the task may be too ambiguous and may benefit from revision or reframing.
*   **Your task must be compatible with the grading options**. Review [grading options in the API](/docs/api-reference/graders) first and verify it's possible to grade your task with them.
*   **Your eval results must be variable enough to improve**. Run [evals](/docs/guides/evals) before using RFT. If your eval scores between minimum and maximum possible scores, you'll have enough data to work with to reinforce positive answers. If the model you want to fine-tune scores at either the absolute minimum or absolute maximum score, RFT won't be useful to you.
*   **Your model must have some success at the desired task**. Reinforcement fine-tuning makes gradual changes, sampling many answers and choosing the best ones. If a model has a 0% success rate at a given task, you cannot bootstrap to higher performance levels through RFT.
*   **Your task should be guess-proof**. If the model can get a higher reward from a lucky guess, the training signal is too noisy, as the model can get the right answer with an incorrect reasoning process. Reframe your task to make guessing more difficult—for example, by expanding classes into subclasses or revising a multiple choice problem to take open-ended answers.

See common use cases, specific implementations, and grader examples in the [reinforcement fine-tuning use case guide](/docs/guides/rft-use-cases).

What is reinforcement learning?

Reinforcement learning is a branch of machine learning in which a model learns by acting, receiving feedback, and readjusting itself to maximise future feedback. Instead of memorising one “right” answer per example, the model explores many possible answers, observes a numeric reward for each, and gradually shifts its behaviour so the high-reward answers become more likely and the low-reward ones disappear. Over repeated rounds, the model converges on a policy—a rule for choosing outputs—that best satisfies the reward signal you define.

In reinforcement fine-tuning (RFT), that reward signal comes from a custom grader that you define for your task. For every prompt in your dataset, the platform samples multiple candidate answers, runs your grader to score them, and applies a policy-gradient update that nudges the model toward answers with higher scores. This cycle—sample, grade, update—continues across the dataset (and successive epochs) until the model reliably optimizes for your grader’s understanding of quality. The grader encodes whatever you care about—accuracy, style, safety, or any metric—so the resulting fine-tuned model reflects those priorities and you don't have to manage reinforcement learning infrastructure.

Reinforcement fine-tuning is supported on o-series reasoning models only, and currently only for [o4-mini](/docs/models/o4-mini).

Example: LLM-powered security review
------------------------------------

To demonstrate reinforcement fine-tuning below, we'll fine-tune an [o4-mini](/docs/models/o4-mini) model to provide expert answers about a fictional company's security posture, based on an internal company policy document. We want the model to return a JSON object that conforms to a specific schema with [Structured Outputs](/docs/guides/structured-outputs).

Example input question:

```text
Do you have a dedicated security team?
```

Using the internal policy document, we want the model to respond with JSON that has two keys:

*   `compliant`: A string `yes`, `no`, or `needs review`, indicating whether the company's policy covers the question.
*   `explanation`: A string of text that briefly explains, based on the policy document, why the question is covered in the policy or why it's not covered.

Example desired output from the model:

```json
{
    "compliant": "yes",
    "explanation": "A dedicated security team follows strict protocols for handling incidents."
}
```

Let's fine-tune a model with RFT to perform well at this task.

Define a grader
---------------

To perform RFT, define a [grader](/docs/guides/graders) to score the model's output during training, indicating the quality of its response. RFT uses the same set of graders as [evals](/docs/guides/evals), which you may already be familiar with.

In this example, we define [multiple graders](/docs/api-reference/graders/multi) to examine the properties of the JSON returned by our fine-tuned model:

*   The [`string_check`](/docs/api-reference/graders/string-check) grader to ensure the proper `compliant` property has been set
*   The [`score_model`](/docs/api-reference/graders/score-model) grader to provide a score between zero and one for the explanation text, using another evaluator model

We weight the output of each property equally in the `calculate_output` expression.

Below is the JSON payload data we'll use for this grader in API requests. In both graders, we use `{{ }}` template syntax to refer to the relevant properties of both the `item` (the row of test data being used for evaluation) and `sample` (the model output generated during the training run).

Grader configuration

Multi-grader configuration object

```json
{
  "type": "multi",
  "graders": {
    "explanation": {
      "name": "Explanation text grader",
      "type": "score_model",
      "input": [
        {
          "role": "user",
          "type": "message",
          "content": "...see other tab for the full prompt..."
        }
      ],
      "model": "gpt-4o-2024-08-06"
    },
    "compliant": {
      "name": "compliant",
      "type": "string_check",
      "reference": "{{item.compliant}}",
      "operation": "eq",
      "input": "{{sample.output_json.compliant}}"
    }
  },
  "calculate_output": "0.5 * compliant + 0.5 * explanation"
}
```

Grading prompt

Grading prompt in the grader config

```markdown
# Overview

Evaluate the accuracy of the model-generated answer based on the 
Copernicus Product Security Policy and an example answer. The response 
should align with the policy, cover key details, and avoid speculative 
or fabricated claims.

Always respond with a single floating point number 0 through 1,
using the grading criteria below.

## Grading Criteria:
- **1.0**: The model answer is fully aligned with the policy and factually correct.
- **0.75**: The model answer is mostly correct but has minor omissions or slight rewording that does not change meaning.
- **0.5**: The model answer is partially correct but lacks key details or contains speculative statements.
- **0.25**: The model answer is significantly inaccurate or missing important information.
- **0.0**: The model answer is completely incorrect, hallucinates policy details, or is irrelevant.

## Copernicus Product Security Policy

### Introduction
Protecting customer data is a top priority for Copernicus. Our platform is designed with industry-standard security and compliance measures to ensure data integrity, privacy, and reliability.

### Data Classification
Copernicus safeguards customer data, which includes prompts, responses, file uploads, user preferences, and authentication configurations. Metadata, such as user IDs, organization IDs, IP addresses, and device details, is collected for security purposes and stored securely for monitoring and analytics.

### Data Management
Copernicus utilizes cloud-based storage with strong encryption (AES-256) and strict access controls. Data is logically segregated to ensure confidentiality and access is restricted to authorized personnel only. Conversations and other customer data are never used for model training.

### Data Retention
Customer data is retained only for providing core functionalities like conversation history and team collaboration. Customers can configure data retention periods, and deleted content is removed from our system within 30 days.

### User Authentication & Access Control
Users authenticate via Single Sign-On (SSO) using an Identity Provider (IdP). Roles include Account Owner, Admin, and Standard Member, each with defined permissions. User provisioning can be automated through SCIM integration.

### Compliance & Security Monitoring
- **Compliance API**: Logs interactions, enabling data export and deletion.
- **Audit Logging**: Ensures transparency for security audits.
- **HIPAA Support**: Business Associate Agreements (BAAs) available for customers needing healthcare compliance.
- **Security Monitoring**: 24/7 monitoring for threats and suspicious activity.
- **Incident Response**: A dedicated security team follows strict protocols for handling incidents.

### Infrastructure Security
- **Access Controls**: Role-based authentication with multi-factor security.
- **Source Code Security**: Controlled code access with mandatory reviews before deployment.
- **Network Security**: Web application firewalls and strict ingress/egress controls to prevent unauthorized access.
- **Physical Security**: Data centers have controlled access, surveillance, and environmental risk management.

### Bug Bounty Program
Security researchers are encouraged to report vulnerabilities through our Bug Bounty Program for responsible disclosure and rewards.

### Compliance & Certifications
Copernicus maintains compliance with industry standards, including SOC 2 and GDPR. Customers can access security reports and documentation via our Security Portal.

### Conclusion
Copernicus prioritizes security, privacy, and compliance. For inquiries, contact your account representative or visit our Security Portal.

## Examples

### Example 1: GDPR Compliance
**Reference Answer**: 'Copernicus maintains compliance with industry standards, including SOC 2 and GDPR. Customers can access security reports and documentation via our Security Portal.'

**Model Answer 1**: 'Yes, Copernicus is GDPR compliant and provides compliance documentation via the Security Portal.' 
**Score: 1.0** (fully correct)

**Model Answer 2**: 'Yes, Copernicus follows GDPR standards.'
**Score: 0.75** (mostly correct but lacks detail about compliance reports)

**Model Answer 3**: 'Copernicus may comply with GDPR but does not provide documentation.'
**Score: 0.5** (partially correct, speculative about compliance reports)

**Model Answer 4**: 'Copernicus does not follow GDPR standards.'
**Score: 0.0** (factually incorrect)

### Example 2: Encryption in Transit
**Reference Answer**: 'The Copernicus Product Security Policy states that data is stored with strong encryption (AES-256) and that network security measures include web application firewalls and strict ingress/egress controls. However, the policy does not explicitly mention encryption of data in transit (e.g., TLS encryption). A review is needed to confirm whether data transmission is encrypted.'

**Model Answer 1**: 'Data is encrypted at rest using AES-256, but a review is needed to confirm encryption in transit.'
**Score: 1.0** (fully correct)

**Model Answer 2**: 'Yes, Copernicus encrypts data in transit and at rest.'
**Score: 0.5** (partially correct, assumes transit encryption without confirmation)

**Model Answer 3**: 'All data is protected with encryption.'
**Score: 0.25** (vague and lacks clarity on encryption specifics)

**Model Answer 4**: 'Data is not encrypted in transit.'
**Score: 0.0** (factually incorrect)

Reference Answer: {{item.explanation}}
Model Answer: {{sample.output_json.explanation}}
```

Prepare your dataset
--------------------

To create an RFT fine-tune, you'll need both a training and test dataset. Both the training and test datasets will share the same [JSONL format](https://jsonlines.org/). Each line in the JSONL data file will contain a `messages` array, along with any additional fields required to grade the output from the model. The full specification for RFT dataset [can be found here](/docs/api-reference/fine-tuning/reinforcement-input).

In our case, in addition to the `messages` array, each line in our JSONL file also needs `compliant` and `explanation` properties, which we can use as reference values to test the fine-tuned model's Structured Output.

A single line in our training and test datasets looks like this as indented JSON:

```json
{
    "messages": [{
        "role": "user",
        "content": "Do you have a dedicated security team?"
    }],
    "compliant": "yes",
    "explanation": "A dedicated security team follows strict protocols for handling incidents."
}
```

Below, find some JSONL data you can use for both training and testing when you create your fine-tune job. Note that these datasets are for illustration purposes only—in your real test data, strive for diverse and representative inputs for your application.

**Training set**

```text
{"messages":[{"role":"user","content":"Do you have a dedicated security team?"}],"compliant":"yes","explanation":"A dedicated security team follows strict protocols for handling incidents."}
{"messages":[{"role":"user","content":"Have you undergone third-party security audits or penetration testing in the last 12 months?"}],"compliant":"needs review","explanation":"The policy does not explicitly mention undergoing third-party security audits or penetration testing. It only mentions SOC 2 and GDPR compliance."}
{"messages":[{"role":"user","content":"Is your software SOC 2, ISO 27001, or similarly certified?"}],"compliant":"yes","explanation":"The policy explicitly mentions SOC 2 compliance."}
```

**Test set**

```text
{"messages":[{"role":"user","content":"Will our data be encrypted at rest?"}],"compliant":"yes","explanation":"Copernicus utilizes cloud-based storage with strong encryption (AES-256) and strict access controls."}
{"messages":[{"role":"user","content":"Will data transmitted to/from your services be encrypted in transit?"}],"compliant":"needs review","explanation":"The policy does not explicitly mention encryption of data in transit. It focuses on encryption in cloud storage."}
{"messages":[{"role":"user","content":"Do you enforce multi-factor authentication (MFA) internally?"}],"compliant":"yes","explanation":"The policy explicitly mentions role-based authentication with multi-factor security."}
```

How much training data is needed?

Start small—between several dozen and a few hundred examples—to determine the usefulness of RFT before investing in a large dataset. For product safety reasons, the training set must first pass through an automated screening process. Large datasets take longer to process. This screening process begins when you start a fine-tuning job with a file, not upon initial file upload. Once a file has successfully completed screening, you can use it repeatedly without delay.

Dozens of examples can be meaningful as long as they're high quality. After screening, more data is better, as long as it remains high quality. With larger datasets, you can use a higher batch size, which tends to improve training stability.

Your training file can contain a maximum of 50,000 examples. Test datasets can contain a maximum of 1,000 examples. Test datasets also go through automated screening.

### Upload your files

The process for uploading RFT training and test data files is the same as [supervised fine-tuning](/docs/guides/supervised-fine-tuning). Upload your training data to OpenAI either through the [API](/docs/api-reference/files/create) or [using our UI](/storage). Files must be uploaded with a purpose of `fine-tune` in order to be used with fine-tuning.

**You need file IDs for both your test and training data files** to create a fine-tune job.

Create a fine-tune job
----------------------

Create a fine-tune job using either the [API](/docs/api-reference/fine-tuning) or [fine-tuning dashboard](/finetune). To do this, you need:

*   File IDs for both your training and test datasets
*   The grader configuration we created earlier
*   The model ID you want to use as a base for fine-tuning (we'll use `o4-mini-2025-04-16`)
*   If you're fine-tuning a model that will return JSON data as a structured output, you need the JSON schema for the returned object as well (see below)
*   Optionally, any hyperparameters you want to configure for the fine-tune
*   To qualify for [data sharing inference pricing](/docs/pricing#fine-tuning), you need to first [share evaluation and fine-tuning data](https://help.openai.com/en/articles/10306912-sharing-feedback-evaluation-and-fine-tuning-data-and-api-inputs-and-outputs-with-openai#h_c93188c569) with OpenAI before creating the job

### Structured Outputs JSON schema

If you're fine-tuning a model to return [Structured Outputs](/docs/guides/structured-outputs), provide the JSON schema being used to format the output. See a valid JSON schema for our security interview use case:

```json
{
  "type": "json_schema",
  "json_schema": {
    "name": "security_assistant",
    "strict": true,
    "schema": {
        "type": "object",
        "properties": {
          "compliant": { "type": "string" },
          "explanation": { "type": "string" }
        },
        "required": [ "compliant", "explanation" ],
        "additionalProperties": false
    }
  }
}
```

Generating a JSON schema from a Pydantic model

To simplify JSON schema generation, start from a [Pydantic BaseModel](https://docs.pydantic.dev/latest/api/base_model/) class:

1.  Define your class
2.  Use `to_strict_json_schema` from the OpenAI library to generate a valid schema
3.  Wrap the schema in a dictionary with `type` and `name` keys, and set `strict` to true
4.  Take the resulting object and supply it as the `response_format` in your RFT job

```python
from openai.lib._pydantic import to_strict_json_schema
from pydantic import BaseModel

class MyCustomClass(BaseModel):
    name: str
    age: int

# Note: Do not use MyCustomClass.model_json_schema() in place of
# to_strict_json_schema as it is not equivalent
response_format = dict(
    type="json_schema",
    json_schema=dict(
        name=MyCustomClass.__name__,
        strict=True,
        schema=schema
    )
)
```

### Create a job with the API

Configuring a job with the API has a lot of moving parts, so many users prefer to configure them in the [fine-tuning dashboard UI](/finetune). However, here's a complete API request to kick off a fine-tune job with all the configuration we've set up in this guide so far:

```bash
curl https://api.openai.com/v1/fine_tuning/jobs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{
  "training_file": "file-2STiufDaGXWCnT6XUBUEHW",
  "validation_file": "file-4TcgH85ej7dFCjZ1kThCYb",
  "model": "o4-mini-2025-04-16",
  "method": {
    "type": "reinforcement",
    "reinforcement": {
      "grader": {
        "type": "multi",
        "graders": {
          "explanation": {
            "name": "Explanation text grader",
            "type": "score_model",
            "input": [
              {
                "role": "user",
                "type": "message",
                "content": "# Overview\n\nEvaluate the accuracy of the model-generated answer based on the \nCopernicus Product Security Policy and an example answer. The response \nshould align with the policy, cover key details, and avoid speculative \nor fabricated claims.\n\nAlways respond with a single floating point number 0 through 1,\nusing the grading criteria below.\n\n## Grading Criteria:\n- **1.0**: The model answer is fully aligned with the policy and factually correct.\n- **0.75**: The model answer is mostly correct but has minor omissions or slight rewording that does not change meaning.\n- **0.5**: The model answer is partially correct but lacks key details or contains speculative statements.\n- **0.25**: The model answer is significantly inaccurate or missing important information.\n- **0.0**: The model answer is completely incorrect, hallucinates policy details, or is irrelevant.\n\n## Copernicus Product Security Policy\n\n### Introduction\nProtecting customer data is a top priority for Copernicus. Our platform is designed with industry-standard security and compliance measures to ensure data integrity, privacy, and reliability.\n\n### Data Classification\nCopernicus safeguards customer data, which includes prompts, responses, file uploads, user preferences, and authentication configurations. Metadata, such as user IDs, organization IDs, IP addresses, and device details, is collected for security purposes and stored securely for monitoring and analytics.\n\n### Data Management\nCopernicus utilizes cloud-based storage with strong encryption (AES-256) and strict access controls. Data is logically segregated to ensure confidentiality and access is restricted to authorized personnel only. Conversations and other customer data are never used for model training.\n\n### Data Retention\nCustomer data is retained only for providing core functionalities like conversation history and team collaboration. Customers can configure data retention periods, and deleted content is removed from our system within 30 days.\n\n### User Authentication & Access Control\nUsers authenticate via Single Sign-On (SSO) using an Identity Provider (IdP). Roles include Account Owner, Admin, and Standard Member, each with defined permissions. User provisioning can be automated through SCIM integration.\n\n### Compliance & Security Monitoring\n- **Compliance API**: Logs interactions, enabling data export and deletion.\n- **Audit Logging**: Ensures transparency for security audits.\n- **HIPAA Support**: Business Associate Agreements (BAAs) available for customers needing healthcare compliance.\n- **Security Monitoring**: 24/7 monitoring for threats and suspicious activity.\n- **Incident Response**: A dedicated security team follows strict protocols for handling incidents.\n\n### Infrastructure Security\n- **Access Controls**: Role-based authentication with multi-factor security.\n- **Source Code Security**: Controlled code access with mandatory reviews before deployment.\n- **Network Security**: Web application firewalls and strict ingress/egress controls to prevent unauthorized access.\n- **Physical Security**: Data centers have controlled access, surveillance, and environmental risk management.\n\n### Bug Bounty Program\nSecurity researchers are encouraged to report vulnerabilities through our Bug Bounty Program for responsible disclosure and rewards.\n\n### Compliance & Certifications\nCopernicus maintains compliance with industry standards, including SOC 2 and GDPR. Customers can access security reports and documentation via our Security Portal.\n\n### Conclusion\nCopernicus prioritizes security, privacy, and compliance. For inquiries, contact your account representative or visit our Security Portal.\n\n## Examples\n\n### Example 1: GDPR Compliance\n**Reference Answer**: Copernicus maintains compliance with industry standards, including SOC 2 and GDPR. Customers can access security reports and documentation via our Security Portal.\n\n**Model Answer 1**: Yes, Copernicus is GDPR compliant and provides compliance documentation via the Security Portal. \n**Score: 1.0** (fully correct)\n\n**Model Answer 2**: Yes, Copernicus follows GDPR standards.\n**Score: 0.75** (mostly correct but lacks detail about compliance reports)\n\n**Model Answer 3**: Copernicus may comply with GDPR but does not provide documentation.\n**Score: 0.5** (partially correct, speculative about compliance reports)\n\n**Model Answer 4**: Copernicus does not follow GDPR standards.\n**Score: 0.0** (factually incorrect)\n\n### Example 2: Encryption in Transit\n**Reference Answer**: The Copernicus Product Security Policy states that data is stored with strong encryption (AES-256) and that network security measures include web application firewalls and strict ingress/egress controls. However, the policy does not explicitly mention encryption of data in transit (e.g., TLS encryption). A review is needed to confirm whether data transmission is encrypted.\n\n**Model Answer 1**: Data is encrypted at rest using AES-256, but a review is needed to confirm encryption in transit.\n**Score: 1.0** (fully correct)\n\n**Model Answer 2**: Yes, Copernicus encrypts data in transit and at rest.\n**Score: 0.5** (partially correct, assumes transit encryption without confirmation)\n\n**Model Answer 3**: All data is protected with encryption.\n**Score: 0.25** (vague and lacks clarity on encryption specifics)\n\n**Model Answer 4**: Data is not encrypted in transit.\n**Score: 0.0** (factually incorrect)\n\nReference Answer: {{item.explanation}}\nModel Answer: {{sample.output_json.explanation}}\n"
              }
            ],
            "model": "gpt-4o-2024-08-06"
          },
          "compliant": {
            "name": "compliant",
            "type": "string_check",
            "reference": "{{item.compliant}}",
            "operation": "eq",
            "input": "{{sample.output_json.compliant}}"
          }
        },
        "calculate_output": "0.5 * compliant + 0.5 * explanation"
      },
      "response_format": {
        "type": "json_schema",
        "json_schema": {
          "name": "security_assistant",
          "strict": true,
          "schema": {
            "type": "object",
            "properties": {
              "compliant": { 
                "type": "string"
              },
              "explanation": {
                "type": "string"
              }
            },
            "required": [
              "compliant",
              "explanation"
            ],
            "additionalProperties": false
          }
        }
      },
      "hyperparameters": {
        "reasoning_effort": "medium"
      }
    }
  }
}'
```

This request returns a [fine-tuning job object](/docs/api-reference/fine-tuning/object), which includes a job `id`. Use this ID to monitor the progress of your job and retrieve the fine-tuned model when the job is complete.

To qualify for [data sharing inference pricing](/docs/pricing#fine-tuning), make sure to [share evaluation and fine-tuning data](https://help.openai.com/en/articles/10306912-sharing-feedback-evaluation-and-fine-tuning-data-and-api-inputs-and-outputs-with-openai#h_c93188c569) with OpenAI before creating the job. You can verify the job was marked as shared by confirming `shared_with_openai` is set to `true`.

### Monitoring your fine-tune job

Fine-tuning jobs take some time to complete, and RFT jobs tend to take longer than SFT or DPO jobs. To monitor the progress of your fine-tune job, use the [fine-tuning dashboard](/finetune) or the [API](/docs/api-reference/fine-tuning).

#### Reward metrics

For reinforcement fine-tuning jobs, the primary metrics are the per-step **reward** metrics. These metrics indicate how well your model is performing on the training data. They're calculated by the graders you defined in your job configuration. These are two separate top-level reward metrics:

*   `train_reward_mean`: The average reward across the samples taken from all datapoints in the current step. Because the specific datapoints in a batch change with each step, `train_reward_mean` values across different steps are not directly comparable and the specific values can fluctuate drastically from step to step.
*   `valid_reward_mean`: The average reward across the samples taken from all datapoints in the validation set, which is a more stable metric.

![Reward Metric Graph](https://cdn.openai.com/API/images/guides/RFT_Reward_Chart.png)

Find a full description of all training metrics in the [training metrics](#training-metrics) section.

#### Pausing and resuming jobs

To evaluate the current state of the model when your job is only partially finished, **pause** the job to stop the training process and produce a checkpoint at the current step. You can use this checkpoint to evaluate the model on a held-out test set. If the results look good, **resume** the job to continue training from that checkpoint. Learn more in [pausing and resuming jobs](#pausing-and-resuming-jobs).

#### Evals integration

Reinforcement fine-tuning jobs are integrated with our [evals product](/docs/guides/evals). When you make a reinforcement fine-tuning job, a new eval is automatically created and associated with the job. As validation steps are performed, we combine the input prompts, model samples, and grader outputs to make a new [eval run](/docs/guides/evals#creating-an-eval-run) for that step.

Learn more about the evals integration in the [appendix](#evals-integration-details) section below.

Evaluate the results
--------------------

By the time your fine-tuning job finishes, you should have a decent idea of how well the model is performing based on the mean reward value on the validation set. However, it's possible that the model has either _overfit_ to the training data or has learned to [reward hack](https://en.wikipedia.org/wiki/Reward_hacking) your grader, which allows it to produce high scores without actually being correct. Before deploying your model, inspect its behavior on a representative set of prompts to ensure it behaves how you expect.

Understanding the model's behavior can be done quickly by inspecting the evals associated with the fine-tuning job. Specifically, pay close attention to the run made for the final training step to see the end model's behavior. You can also use the evals product to compare the final run to earlier runs and see how the model's behavior has changed over the course of training.

### Try using your fine-tuned model

Evaluate your newly optimized model by using it! When the fine-tuned model finishes training, use its ID in either the [Responses](/docs/api-reference/responses) or [Chat Completions](/docs/api-reference/chat) API, just as you would an OpenAI base model.

Use your model in the Playground

1.  Navigate to your fine-tuning job in [the dashboard](https://platform.openai.com/finetune).
2.  In the right pane, navigate to **Output model** and copy the model ID. It should start with `ft:…`
3.  Open the [Playground](https://platform.openai.com/playground).
4.  In the **Model** dropdown menu, paste the model ID. Here, you should also see other fine-tuned models you've created.
5.  Run some prompts and see how your fine-tuned performs!

Use your model with an API call

```bash
curl https://api.openai.com/v1/responses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{
    "model": "ft:gpt-4.1-nano-2025-04-14:openai::BTz2REMH",
    "input": "What is 4+4?"
  }'
```

### Use checkpoints if needed

Checkpoints are models you can use that are created before the final step of the training process. For RFT, OpenAI creates a full model checkpoint at each validation step and keeps the three with the highest `valid_reward_mean` scores. Checkpoints are useful for evaluating the model at different points in the training process and comparing performance at different steps.

Find checkpoints in the dashboard

1.  Navigate to the [fine-tuning dashboard](https://platform.openai.com/finetune).
2.  In the left panel, select the job you want to investigate. Wait until it succeeds.
3.  In the right panel, scroll to the list of checkpoints.
4.  Hover over any checkpoint to see a link to launch in the Playground.
5.  Test the checkpoint model's behavior by prompting it in the Playground.

Query the API for checkpoints

1.  Wait until a job succeeds, which you can verify by [querying the status of a job](/docs/api-reference/fine-tuning/retrieve).
2.  [Query the checkpoints endpoint](/docs/api-reference/fine-tuning/list-checkpoints) with your fine-tuning job ID to access a list of model checkpoints for the fine-tuning job.
3.  Find the `fine_tuned_model_checkpoint` field for the name of the model checkpoint.
4.  Use this model just like you would the final fine-tuned model.

The checkpoint object contains `metrics` data to help you determine the usefulness of this model. As an example, the response looks like this:

```json
{
  "object": "fine_tuning.job.checkpoint",
  "id": "ftckpt_zc4Q7MP6XxulcVzj4MZdwsAB",
  "created_at": 1519129973,
  "fine_tuned_model_checkpoint": "ft:gpt-3.5-turbo-0125:my-org:custom-suffix:96olL566:ckpt-step-2000",
  "metrics": {
    "full_valid_loss": 0.134,
    "full_valid_mean_token_accuracy": 0.874
  },
  "fine_tuning_job_id": "ftjob-abc123",
  "step_number": 2000
}
```

Each checkpoint specifies:

*   `step_number`: The step at which the checkpoint was created (where each epoch is number of steps in the training set divided by the batch size)
*   `metrics`: An object containing the metrics for your fine-tuning job at the step when the checkpoint was created

Next steps
----------

Now that you know the basics of reinforcement fine-tuning, explore other fine-tuning methods.

[

Supervised fine-tuning

Fine-tune a model by providing correct outputs for sample inputs.

](/docs/guides/supervised-fine-tuning)[

Vision fine-tuning

Learn to fine-tune for computer vision with image inputs.

](/docs/guides/vision-fine-tuning)[

Direct preference optimization

Fine-tune a model using direct preference optimization (DPO).

](/docs/guides/direct-preference-optimization)

Appendix
--------

### Training metrics

Reinforcement fine-tuning jobs publish per-step training metrics as [fine-tuning events](/docs/api-reference/fine-tuning/event-object). Pull these metrics through the [API](/docs/api-reference/fine-tuning/list-events) or view them as graphs and charts in the [fine-tuning dashboard](/finetune).

Learn more about training metrics below.

Full example training metrics

Below is an example metric event from a real reinforcement fine-tuning job. The various fields in this payload will be discussed in the following sections.

```json
{
      "object": "fine_tuning.job.event",
      "id": "ftevent-Iq5LuNLDsac1C3vzshRBuBIy",
      "created_at": 1746679539,
      "level": "info",
      "message": "Step 10/20 , train mean reward=0.42, full validation mean reward=0.68, full validation mean parse error=0.00",
      "data": {
        "step": 10,
        "usage": {
          "graders": [
            {
              "name": "basic_model_grader",
              "type": "score_model",
              "model": "gpt-4o-2024-08-06",
              "train_prompt_tokens_mean": 241.0,
              "valid_prompt_tokens_mean": 241.0,
              "train_prompt_tokens_count": 120741.0,
              "valid_prompt_tokens_count": 4820.0,
              "train_completion_tokens_mean": 138.52694610778443,
              "valid_completion_tokens_mean": 140.5,
              "train_completion_tokens_count": 69402.0,
              "valid_completion_tokens_count": 2810.0
            }
          ],
          "samples": {
            "train_reasoning_tokens_mean": 3330.017964071856,
            "valid_reasoning_tokens_mean": 1948.9,
            "train_reasoning_tokens_count": 1668339.0,
            "valid_reasoning_tokens_count": 38978.0
          }
        },
        "errors": {
          "graders": [
            {
              "name": "basic_model_grader",
              "type": "score_model",
              "train_other_error_mean": 0.0,
              "valid_other_error_mean": 0.0,
              "train_other_error_count": 0.0,
              "valid_other_error_count": 0.0,
              "train_sample_parse_error_mean": 0.0,
              "valid_sample_parse_error_mean": 0.0,
              "train_sample_parse_error_count": 0.0,
              "valid_sample_parse_error_count": 0.0,
              "train_invalid_variable_error_mean": 0.0,
              "valid_invalid_variable_error_mean": 0.0,
              "train_invalid_variable_error_count": 0.0,
              "valid_invalid_variable_error_count": 0.0
            }
          ]
        },
        "scores": {
          "graders": [
            {
              "name": "basic_model_grader",
              "type": "score_model",
              "train_reward_mean": 0.4471057884231537,
              "valid_reward_mean": 0.675
            }
          ],
          "train_reward_mean": 0.4215686274509804,
          "valid_reward_mean": 0.675
        },
        "timing": {
          "step": {
            "eval": 101.69386267662048,
            "sampling": 226.82190561294556,
            "training": 402.43121099472046,
            "full_iteration": 731.5038568973541
          },
          "graders": [
            {
              "name": "basic_model_grader",
              "type": "score_model",
              "train_execution_latency_mean": 2.6894934929297594,
              "valid_execution_latency_mean": 4.141402995586395
            }
          ]
        },
        "total_steps": 20,
        "train_mean_reward": 0.4215686274509804,
        "reasoning_tokens_mean": 3330.017964071856,
        "completion_tokens_mean": 3376.0019607843137,
        "full_valid_mean_reward": 0.675,
        "mean_unresponsive_rewards": 0.0,
        "model_graders_token_usage": {
          "gpt-4o-2024-08-06": {
            "eval_cached_tokens": 0,
            "eval_prompt_tokens": 4820,
            "train_cached_tokens": 0,
            "train_prompt_tokens": 120741,
            "eval_completion_tokens": 2810,
            "train_completion_tokens": 69402
          }
        },
        "full_valid_mean_parse_error": 0.0,
        "valid_reasoning_tokens_mean": 1948.9
      },
      "type": "metrics"
    },
```

Score metrics

The top-level metrics to watch are `train_reward_mean` and `valid_reward_mean`, which indicate the average reward assigned by your graders across all samples in the training and validation datasets, respectively.

Additionally, if you use a [multi-grader](/docs/api-reference/graders/multi) configuration, per-grader train and validation reward metrics will be published as well. These metrics are included under the `event.data.scores` object in the fine-tuning events object, with one entry per grader. The per-grader metrics are useful for understanding how the model is performing on each individual grader, and can help you identify if the model is overfitting to one grader or another.

From the fine-tuning dashboard, the individual grader metrics will be displayed in their own graph below the overall `train_reward_mean` and `valid_reward_mean` metrics.

![Per-Grader Reward Metric Graph](https://cdn.openai.com/API/images/guides/RFT_MultiReward_Chart.png)

Usage metrics

An important characteristic of a reasoning model is the number of reasoning tokens it uses before responding to a prompt. Often, during training, the model will drastically change the average number of reasoning tokens it uses to respond to a prompt. This is a sign that the model is changing its behavior in response to the reward signal. The model may learn to use fewer reasoning tokens to achieve the same reward, or it may learn to use more reasoning tokens to achieve a higher reward.

You can monitor the `train_reasoning_tokens_mean` and `valid_reasoning_tokens_mean` metrics to see how the model is changing its behavior over time. These metrics are the average number of reasoning tokens used by the model to respond to a prompt in the training and validation datasets, respectively. You can also view the mean reasoning token count in the fine-tuning dashboard under the "Reasoning Tokens" chart.

![Reasoning Tokens Metric Graph](https://cdn.openai.com/API/images/guides/RFT_ReasoningTokens_Chart.png)

If you are using [model graders](/docs/guides/graders#model-graders), you will likely want to monitor the token usage of these graders. Per-grader token usage statistics are available under the `event.data.usage.graders` object, and are broken down into:

*   `train_prompt_tokens_mean`
*   `train_prompt_tokens_count`
*   `train_completion_tokens_mean`
*   `train_completion_tokens_count`.

The `_mean` metrics represent the average number of tokens used by the grader to process all prompts in the current step, while the `_count` metrics represent the total number of tokens used by the grader across all samples in the current step. The per-step token usage is also displayed on the fine-tuning dashboard under the "Grading Token Usage" chart.

![Model Grader Token Usage](https://cdn.openai.com/API/images/guides/RFT_ModelGraderTokenUsage.png)

Timing metrics

We include various metrics that help you understand how long each step of the training process is taking and how different parts of the training process are contributing to the per-step timing.

These metrics are available under the `event.data.timing` object, and are broken down into `step` and `graders` fields.

The `step` field contains the following metrics:

*   `sampling`: The time taken to sample the model outputs (rollouts) for the current step.
*   `training`: The time taken to train the model (backpropagation) for the current step.
*   `eval`: The time taken to evaluate the model on the full validation set.
*   `full_iteration`: The total time taken for the current step, including the above 3 metrics plus any additional overhead.

The step timing metrics are also displayed on the fine-tuning dashboard under the "Per Step Duration" chart.

![Per Step Duration Graph](https://cdn.openai.com/API/images/guides/RFT_PerStepDuration2.png)

The `graders` field contains timing information that details the time taken to execute each grader for the current step. Each grader will have its own timing under the `train_execution_latency_mean` and `valid_execution_latency_mean` metrics, which represent the average time taken to execute the grader on the training and validation datasets, respectively.

Graders are executed in parallel with a concurrency limit, so it is not always clear how individual grader latency adds up to the total time taken for grading. However, it is generally true that graders which take longer to execute individually will cause a job to execute more slowly. This means that slower model graders will cause the job to take longer to complete, and more expensive python code will do the same. The fastest graders generally are `string_check` and `text_similarity` as those are executed local to the training loop.

### Evals integration details

Reinforcement fine-tuning jobs are directly integrated with our [evals product](/docs/guides/evals). When you make a reinforcement fine-tuning job, a new eval is automatically created and associated with the job.

As validation steps are performed, the input prompts, model samples, grader outputs, and more metadata will be combined to make a new [eval run](/docs/guides/evals#creating-an-eval-run) for that step. At the end of the job, you will have one run for each validation step. This allows you to compare the performance of the model at different steps, and to see how the model's behavior has changed over the course of training.

You can find the eval associated with your fine-tuning job by viewing your job on the fine-tuning dashboard, or by finding the `eval_id` field on the [fine-tuning job object](/docs/api-reference/fine-tuning/object).

The evals product is useful for inspecting the outputs of the model on specific datapoints, to get an understanding for how the model is behaving in different scenarios. It can help you figure out which slice of your dataset the model is performing poorly on which can help you identify areas for improvement in your training data.

The evals product can also help you find areas of improvement for your graders by finding areas where the grader is either overly lenient or overly harsh on the model outputs.

### Pausing and resuming jobs

You can pause a fine-tuning job at any time by using the [fine-tuning jobs API](/docs/api-reference/fine-tuning/pause). Calling the pause API will tell the training process to create a new model snapshot, stop training, and put the job into a "Paused" state. The model snapshot will go through a normal safety screening process after which it will be available for you to use throughout the OpenAI platform as a normal fine-tuned model.

If you wish to continue the training process for a paused job, you can do so by using the [fine-tuning jobs API](/docs/api-reference/fine-tuning/resume). This will resume the training process from the last checkpoint created when the job was paused and will continue training until the job is either completed or paused again.

### Grading with Tools

If you are training your model to [perform tool calls](/docs/guides/function-calling), you will need to:

1.  Provide the set of tools available for your model to call on each datapoint in the RFT training dataset. More info here in the [dataset API reference](/docs/api-reference/fine-tuning/reinforcement-input).
2.  Configure your grader to assign rewards based on the contents of the tool calls made by the model. Information on grading tools calls can be found [here in the grading docs](/docs/guides/graders/#sample-namespace)

### Billing details

Reinforcement fine-tuning jobs are billed based on the amount of time spent training, as well as the number of tokens used by the model during training. We only bill for time spent in the core training loop, not for time spent preparing the training data, validating datasets, waiting in queues, running safety evals, or other overhead.

Details on exactly how we bill for reinforcement fine-tuning jobs can be found in this [help center article](https://help.openai.com/en/articles/11323177-billing-guide-for-the-reinforcement-fine-tuning-api).

### Training errors

Reinforcement fine-tuning is a complex process with many moving parts, and there are many places where things can go wrong. We publish various error metrics to help you understand what is going wrong in your job, and how to fix it. In general, we try to avoid failing a job entirely unless a very serious error occurs. When errors do occur, they often happen during the grading step. Errors during grading often happen either to the model outputting a sample that the grader doesn't know how to handle, the grader failing to execute properly due to some sort of system error, or due to a bug in the grading logic itself.

The error metrics are available under the `event.data.errors` object, and are aggregated into counts and rates rolled up per-grader. We also display rates and counts of errors on the fine-tuning dashboard.

Grader errors

#### Generic grading errors

The grader errors are broken down into the following categories, and they exist in both `train_` (for training data) and `valid_` (for validation data) versions:

*   `sample_parse_error_mean`: The average number of samples that failed to parse correctly. This often happens when the model fails to output valid JSON or adhere to a provided response format correctly. A small percentage of these errors, especially early in the training process, is normal. If you see a large number of these errors, it is likely that the response format of the model is not configured correctly or that your graders are misconfigured and looking for incorrect fields.
*   `invalid_variable_error_mean`: These errors occur when you attempt to reference a variable via a template that cannot be found either in the current datapoint or in the current model sample. This can happen if the model fails to provide output in the correct response format, or if your grader is misconfigured.
*   `other_error_mean`: This is a catch-all for any other errors that occur during grading. These errors are often caused by bugs in the grading logic itself, or by system errors that occur during grading.

#### Python grading errors

*   `python_grader_server_error_mean`: These errors occur when our system for executing python graders in a remote sandbox experiences system errors. This normally happens due to reasons outside of your control, like networking failures or system outages. If you see a large number of these errors, it is likely that there is a system issue that is causing the errors. You can check the [OpenAI status page](https://status.openai.com/) for more information on any ongoing issues.
*   `python_grader_runtime_error_mean`: These errors occur when the python grader itself fails to execute properly. This can happen for a variety of reasons, including bugs in the grading logic, or if the grader is trying to access a variable that doesn't exist in the current context. If you see a large number of these errors, it is likely that there is a bug in your grading logic that needs to be fixed. If a large enough number of these errors occur, the job will fail and we will show you a sampling of tracebacks from the failed graders.

#### Model grading errors

*   `model_grader_server_error_mean`: These errors occur when we fail to sample from a model grader. This can happen for a variety of reasons, but generally means that either the model grader was misconfigured, that you are attempting to use a model that is not available to your organization, or that there is a system issue that is happening at OpenAI.

Was this page useful?



Image generation
================

Learn how to generate or edit images.

Overview
--------

The OpenAI API lets you generate and edit images from text prompts, using the GPT Image or DALL·E models. You can access image generation capabilities through two APIs:

### Image API

The [Image API](/docs/api-reference/images) provides three endpoints, each with distinct capabilities:

*   **Generations**: [Generate images](#generate-images) from scratch based on a text prompt
*   **Edits**: [Modify existing images](#edit-images) using a new prompt, either partially or entirely
*   **Variations**: [Generate variations](#image-variations) of an existing image (available with DALL·E 2 only)

This API supports `gpt-image-1` as well as `dall-e-2` and `dall-e-3`.

### Responses API

The [Responses API](/docs/api-reference/responses/create#responses-create-tools) allows you to generate images as part of conversations or multi-step flows. It supports image generation as a [built-in tool](/docs/guides/tools?api-mode=responses), and accepts image inputs and outputs within context.

Compared to the Image API, it adds:

*   **Multi-turn editing**: Iteratively make high fidelity edits to images with prompting
*   **Streaming**: Display partial images as the final output is being generated to improve perceived latency
*   **Flexible inputs**: Accept image [File](/docs/api-reference/files) IDs as input images, not just bytes

The image generation tool in responses only supports `gpt-image-1`. For a list of mainline models that support calling this tool, refer to the [supported models](#supported-models) below.

### Choosing the right API

*   If you only need to generate or edit a single image from one prompt, the Image API is your best choice.
*   If you want to build conversational, editable image experiences with GPT Image or display partial images during generation, go with the Responses API.

Both APIs let you [customize output](#customize-image-output) — adjust quality, size, format, compression, and enable transparent backgrounds.

### Model comparison

Our latest and most advanced model for image generation is `gpt-image-1`, a natively multimodal language model.

We recommend this model for its high-quality image generation and ability to use world knowledge in image creation. However, you can also use specialized image generation models—DALL·E 2 and DALL·E 3—with the Image API.

|Model|Endpoints|Use case|
|---|---|---|
|DALL·E 2|Image API: Generations, Edits, Variations|Lower cost, concurrent requests, inpainting (image editing with a mask)|
|DALL·E 3|Image API: Generations only|Higher image quality than DALL·E 2, support for larger resolutions|
|GPT Image|Image API: Generations, Edits – Responses API support coming soon|Superior instruction following, text rendering, detailed editing, real-world knowledge|

This guide focuses on GPT Image, but you can also switch to the docs for [DALL·E 2](/docs/guides/image-generation?image-generation-model=dall-e-2) and [DALL·E 3](/docs/guides/image-generation?image-generation-model=dall-e-3).

To ensure this model is used responsibly, you may need to complete the [API Organization Verification](https://help.openai.com/en/articles/10910291-api-organization-verification) from your [developer console](https://platform.openai.com/settings/organization/general) before using `gpt-image-1`.

![a vet with a baby otter](https://cdn.openai.com/API/docs/images/otter.png)

Generate Images
---------------

You can use the [image generation endpoint](/docs/api-reference/images/create) to create images based on text prompts, or the [image generation tool](/docs/guides/tools?api-mode=responses) in the Responses API to generate images as part of a conversation.

To learn more about customizing the output (size, quality, format, transparency), refer to the [customize image output](#customize-image-output) section below.

You can set the `n` parameter to generate multiple images at once in a single request (by default, the API returns a single image).

Responses API

Generate an image

```javascript
import OpenAI from "openai";
const openai = new OpenAI();

const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: "Generate an image of gray tabby cat hugging an otter with an orange scarf",
    tools: [{type: "image_generation"}],
});

// Save the image to a file
const imageData = response.output
  .filter((output) => output.type === "image_generation_call")
  .map((output) => output.result);

if (imageData.length > 0) {
  const imageBase64 = imageData[0];
  const fs = await import("fs");
  fs.writeFileSync("otter.png", Buffer.from(imageBase64, "base64"));
}
```

```python
from openai import OpenAI
import base64

client = OpenAI() 

response = client.responses.create(
    model="gpt-4.1-mini",
    input="Generate an image of gray tabby cat hugging an otter with an orange scarf",
    tools=[{"type": "image_generation"}],
)

# Save the image to a file
image_data = [
    output.result
    for output in response.output
    if output.type == "image_generation_call"
]
    
if image_data:
    image_base64 = image_data[0]
    with open("otter.png", "wb") as f:
        f.write(base64.b64decode(image_base64))
```

Image API

Generate an image

```javascript
import OpenAI from "openai";
import fs from "fs";
const openai = new OpenAI();

const prompt = `
A children's book drawing of a veterinarian using a stethoscope to 
listen to the heartbeat of a baby otter.
`;

const result = await openai.images.generate({
    model: "gpt-image-1",
    prompt,
});

// Save the image to a file
const image_base64 = result.data[0].b64_json;
const image_bytes = Buffer.from(image_base64, "base64");
fs.writeFileSync("otter.png", image_bytes);
```

```python
from openai import OpenAI
import base64
client = OpenAI()

prompt = """
A children's book drawing of a veterinarian using a stethoscope to 
listen to the heartbeat of a baby otter.
"""

result = client.images.generate(
    model="gpt-image-1",
    prompt=prompt
)

image_base64 = result.data[0].b64_json
image_bytes = base64.b64decode(image_base64)

# Save the image to a file
with open("otter.png", "wb") as f:
    f.write(image_bytes)
```

```bash
curl -X POST "https://api.openai.com/v1/images/generations" \
    -H "Authorization: Bearer $OPENAI_API_KEY" \
    -H "Content-type: application/json" \
    -d '{
        "model": "gpt-image-1",
        "prompt": "A childrens book drawing of a veterinarian using a stethoscope to listen to the heartbeat of a baby otter."
    }' | jq -r '.data[0].b64_json' | base64 --decode > otter.png
```

### Multi-turn image generation

With the Responses API, you can build multi-turn conversations involving image generation either by providing image generation calls outputs within context (you can also just use the image ID), or by using the [`previous_response_id` parameter](/docs/guides/conversation-state?api-mode=responses#openai-apis-for-conversation-state). This makes it easy to iterate on images across multiple turns—refining prompts, applying new instructions, and evolving the visual output as the conversation progresses.

Using previous response ID

Multi-turn image generation

```javascript
import OpenAI from "openai";
const openai = new OpenAI();

const response = await openai.responses.create({
  model: "gpt-4.1-mini",
  input:
    "Generate an image of gray tabby cat hugging an otter with an orange scarf",
  tools: [{ type: "image_generation" }],
});

const imageData = response.output
  .filter((output) => output.type === "image_generation_call")
  .map((output) => output.result);

if (imageData.length > 0) {
  const imageBase64 = imageData[0];
  const fs = await import("fs");
  fs.writeFileSync("cat_and_otter.png", Buffer.from(imageBase64, "base64"));
}

// Follow up

const response_fwup = await openai.responses.create({
  model: "gpt-4.1-mini",
  previous_response_id: response.id,
  input: "Now make it look realistic",
  tools: [{ type: "image_generation" }],
});

const imageData_fwup = response_fwup.output
  .filter((output) => output.type === "image_generation_call")
  .map((output) => output.result);

if (imageData_fwup.length > 0) {
  const imageBase64 = imageData_fwup[0];
  const fs = await import("fs");
  fs.writeFileSync(
    "cat_and_otter_realistic.png",
    Buffer.from(imageBase64, "base64")
  );
}
```

```python
from openai import OpenAI
import base64

client = OpenAI()

response = client.responses.create(
    model="gpt-4.1-mini",
    input="Generate an image of gray tabby cat hugging an otter with an orange scarf",
    tools=[{"type": "image_generation"}],
)

image_data = [
    output.result
    for output in response.output
    if output.type == "image_generation_call"
]

if image_data:
    image_base64 = image_data[0]

    with open("cat_and_otter.png", "wb") as f:
        f.write(base64.b64decode(image_base64))

# Follow up

response_fwup = client.responses.create(
    model="gpt-4.1-mini",
    previous_response_id=response.id,
    input="Now make it look realistic",
    tools=[{"type": "image_generation"}],
)

image_data_fwup = [
    output.result
    for output in response_fwup.output
    if output.type == "image_generation_call"
]

if image_data_fwup:
    image_base64 = image_data_fwup[0]
    with open("cat_and_otter_realistic.png", "wb") as f:
        f.write(base64.b64decode(image_base64))
```

Using image ID

Multi-turn image generation

```javascript
import OpenAI from "openai";
const openai = new OpenAI();

const response = await openai.responses.create({
  model: "gpt-4.1-mini",
  input:
    "Generate an image of gray tabby cat hugging an otter with an orange scarf",
  tools: [{ type: "image_generation" }],
});

const imageGenerationCalls = response.output.filter(
  (output) => output.type === "image_generation_call"
);

const imageData = imageGenerationCalls.map((output) => output.result);

if (imageData.length > 0) {
  const imageBase64 = imageData[0];
  const fs = await import("fs");
  fs.writeFileSync("cat_and_otter.png", Buffer.from(imageBase64, "base64"));
}

// Follow up

const response_fwup = await openai.responses.create({
  model: "gpt-4.1-mini",
  input: [
    {
      role: "user",
      content: [{ type: "input_text", text: "Now make it look realistic" }],
    },
    {
      type: "image_generation_call",
      id: imageGenerationCalls[0].id,
    },
  ],
  tools: [{ type: "image_generation" }],
});

const imageData_fwup = response_fwup.output
  .filter((output) => output.type === "image_generation_call")
  .map((output) => output.result);

if (imageData_fwup.length > 0) {
  const imageBase64 = imageData_fwup[0];
  const fs = await import("fs");
  fs.writeFileSync(
    "cat_and_otter_realistic.png",
    Buffer.from(imageBase64, "base64")
  );
}
```

```python
import openai
import base64

response = openai.responses.create(
    model="gpt-4.1-mini",
    input="Generate an image of gray tabby cat hugging an otter with an orange scarf",
    tools=[{"type": "image_generation"}],
)

image_generation_calls = [
    output
    for output in response.output
    if output.type == "image_generation_call"
]

image_data = [output.result for output in image_generation_calls]

if image_data:
    image_base64 = image_data[0]

    with open("cat_and_otter.png", "wb") as f:
        f.write(base64.b64decode(image_base64))

# Follow up

response_fwup = openai.responses.create(
    model="gpt-4.1-mini",
    input=[
        {
            "role": "user",
            "content": [{"type": "input_text", "text": "Now make it look realistic"}],
        },
        {
            "type": "image_generation_call",
            "id": image_generation_calls[0].id,
        },
    ],
    tools=[{"type": "image_generation"}],
)

image_data_fwup = [
    output.result
    for output in response_fwup.output
    if output.type == "image_generation_call"
]

if image_data_fwup:
    image_base64 = image_data_fwup[0]
    with open("cat_and_otter_realistic.png", "wb") as f:
        f.write(base64.b64decode(image_base64))
```

#### Result

|"Generate an image of gray tabby cat hugging an otter with an orange scarf"||
|"Now make it look realistic"||

### Streaming

The Responses API also supports streaming image generation. This allows you to stream partial images as they are generated, providing a more interactive experience.

You can adjust the `partial_images` parameter to receive 1-3 partial images.

Stream an image

```javascript
import OpenAI from "openai";
import fs from "fs";
const openai = new OpenAI();

const stream = await openai.responses.create({
  model: "gpt-4.1",
  input:
    "Draw a gorgeous image of a river made of white owl feathers, snaking its way through a serene winter landscape",
  stream: true,
  tools: [{ type: "image_generation", partial_images: 2 }],
});

for await (const event of stream) {
  if (event.type === "response.image_generation_call.partial_image") {
    const idx = event.partial_image_index;
    const imageBase64 = event.partial_image_b64;
    const imageBuffer = Buffer.from(imageBase64, "base64");
    fs.writeFileSync(`river${idx}.png`, imageBuffer);
  }
}
```

```python
from openai import OpenAI
import base64

client = OpenAI()

stream = client.responses.create(
    model="gpt-4.1",
    input="Draw a gorgeous image of a river made of white owl feathers, snaking its way through a serene winter landscape",
    stream=True,
    tools=[{"type": "image_generation", "partial_images": 2}],
)

for event in stream:
    if event.type == "response.image_generation_call.partial_image":
        idx = event.partial_image_index
        image_base64 = event.partial_image_b64
        image_bytes = base64.b64decode(image_base64)
        with open(f"river{idx}.png", "wb") as f:
            f.write(image_bytes)
```

#### Result

|Partial 1|Partial 2|Final image|
|---|---|---|
||||

Prompt: Draw a gorgeous image of a river made of white owl feathers, snaking its way through a serene winter landscape

### Revised prompt

When using the image generation tool in the Responses API, the mainline model (e.g. `gpt-4.1`) will automatically revise your prompt for improved performance.

You can access the revised prompt in the `revised_prompt` field of the image generation call:

```json
{
  "id": "ig_123",
  "type": "image_generation_call",
  "status": "completed",
  "revised_prompt": "A gray tabby cat hugging an otter. The otter is wearing an orange scarf. Both animals are cute and friendly, depicted in a warm, heartwarming style.",
  "result": "..."
}
```

Edit Images
-----------

The [image edits](/docs/api-reference/images/createEdit) endpoint lets you:

*   Edit existing images
*   Generate new images using other images as a reference
*   Edit parts of an image by uploading an image and mask indicating which areas should be replaced (a process known as **inpainting**)

### Create a new image using image references

You can use one or more images as a reference to generate a new image.

In this example, we'll use 4 input images to generate a new image of a gift basket containing the items in the reference images.

[![Body Lotion](https://cdn.openai.com/API/docs/images/body-lotion.png)](https://cdn.openai.com/API/docs/images/body-lotion.png)[![Soap](https://cdn.openai.com/API/docs/images/soap.png)](https://cdn.openai.com/API/docs/images/soap.png)[![Incense Kit](https://cdn.openai.com/API/docs/images/incense-kit.png)](https://cdn.openai.com/API/docs/images/incense-kit.png)[![Bath Bomb](https://cdn.openai.com/API/docs/images/bath-bomb.png)](https://cdn.openai.com/API/docs/images/bath-bomb.png)

![Bath Gift Set](https://cdn.openai.com/API/docs/images/bath-set-result.png)

Responses API

With the Responses API, you can provide input images in 2 different ways:

*   By providing an image as a Base64-encoded data URL
*   By providing a file ID (created with the [Files API](/docs/api-reference/files))

We're actively working on supporting fully qualified URLs to image files as input as well.

Create a File

Edit an image

```python
from openai import OpenAI
client = OpenAI()

def create_file(file_path):
  with open(file_path, "rb") as file_content:
    result = client.files.create(
        file=file_content,
        purpose="vision",
    )
    return result.id
```

```javascript
import fs from "fs";
import OpenAI from "openai";

const openai = new OpenAI();

async function createFile(filePath) {
  const fileContent = fs.createReadStream(filePath);
  const result = await openai.files.create({
    file: fileContent,
    purpose: "vision",
  });
  return result.id;
}
```

Create a base64 encoded image

Edit an image

```python
def encode_image(file_path):
    with open(file_path, "rb") as f:
        base64_image = base64.b64encode(f.read()).decode("utf-8")
    return base64_image
```

```javascript
function encodeImage(filePath) {
  const base64Image = fs.readFileSync(filePath, "base64");
  return base64Image;
}
```

Edit an image

```python
from openai import OpenAI
import base64

client = OpenAI()

prompt = """Generate a photorealistic image of a gift basket on a white background 
labeled 'Relax & Unwind' with a ribbon and handwriting-like font, 
containing all the items in the reference pictures."""

base64_image1 = encode_image("body-lotion.png")
base64_image2 = encode_image("soap.png")
file_id1 = create_file("body-lotion.png")
file_id2 = create_file("incense-kit.png")

response = client.responses.create(
    model="gpt-4.1",
    input=[
        {
            "role": "user",
            "content": [
                {"type": "input_text", "text": prompt},
                {
                    "type": "input_image",
                    "image_url": f"data:image/jpeg;base64,{base64_image1}",
                },
                {
                    "type": "input_image",
                    "image_url": f"data:image/jpeg;base64,{base64_image2}",
                },
                {
                    "type": "input_image",
                    "file_id": file_id1,
                },
                {
                    "type": "input_image",
                    "file_id": file_id2,
                }
            ],
        }
    ],
    tools=[{"type": "image_generation"}],
)

image_generation_calls = [
    output
    for output in response.output
    if output.type == "image_generation_call"
]

image_data = [output.result for output in image_generation_calls]

if image_data:
    image_base64 = image_data[0]
    with open("gift-basket.png", "wb") as f:
        f.write(base64.b64decode(image_base64))
else:
    print(response.output.content)
```

```javascript
import fs from "fs";
import OpenAI from "openai";

const openai = new OpenAI();

const prompt = `Generate a photorealistic image of a gift basket on a white background 
labeled 'Relax & Unwind' with a ribbon and handwriting-like font, 
containing all the items in the reference pictures.`;

const base64Image1 = encodeImage("body-lotion.png");
const base64Image2 = encodeImage("soap.png");
const fileId1 = await createFile("body-lotion.png");
const fileId2 = await createFile("incense-kit.png");

const response = await openai.responses.create({
  model: "gpt-4.1",
  input: [
    {
      role: "user",
      content: [
        { type: "input_text", text: prompt },
        {
          type: "input_image",
          image_url: `data:image/jpeg;base64,${base64Image1}`,
        },
        {
          type: "input_image",
          image_url: `data:image/jpeg;base64,${base64Image2}`,
        },
        {
          type: "input_image",
          file_id: fileId1,
        },
        {
          type: "input_image",
          file_id: fileId2,
        },
      ],
    },
  ],
  tools: [{ type: "image_generation" }],
});

const imageData = response.output
  .filter((output) => output.type === "image_generation_call")
  .map((output) => output.result);

if (imageData.length > 0) {
  const imageBase64 = imageData[0];
  const fs = await import("fs");
  fs.writeFileSync("gift-basket.png", Buffer.from(imageBase64, "base64"));
} else {
  console.log(response.output.content);
}
```

Image API

Edit an image

```python
import base64
from openai import OpenAI
client = OpenAI()

prompt = """
Generate a photorealistic image of a gift basket on a white background 
labeled 'Relax & Unwind' with a ribbon and handwriting-like font, 
containing all the items in the reference pictures.
"""

result = client.images.edit(
    model="gpt-image-1",
    image=[
        open("body-lotion.png", "rb"),
        open("bath-bomb.png", "rb"),
        open("incense-kit.png", "rb"),
        open("soap.png", "rb"),
    ],
    prompt=prompt
)

image_base64 = result.data[0].b64_json
image_bytes = base64.b64decode(image_base64)

# Save the image to a file
with open("gift-basket.png", "wb") as f:
    f.write(image_bytes)
```

```javascript
import fs from "fs";
import OpenAI, { toFile } from "openai";

const client = new OpenAI();

const prompt = `
Generate a photorealistic image of a gift basket on a white background 
labeled 'Relax & Unwind' with a ribbon and handwriting-like font, 
containing all the items in the reference pictures.
`;

const imageFiles = [
    "bath-bomb.png",
    "body-lotion.png",
    "incense-kit.png",
    "soap.png",
];

const images = await Promise.all(
    imageFiles.map(async (file) =>
        await toFile(fs.createReadStream(file), null, {
            type: "image/png",
        })
    ),
);

const response = await client.images.edit({
    model: "gpt-image-1",
    image: images,
    prompt,
});

// Save the image to a file
const image_base64 = response.data[0].b64_json;
const image_bytes = Buffer.from(image_base64, "base64");
fs.writeFileSync("basket.png", image_bytes);
```

```bash
curl -s -D >(grep -i x-request-id >&2) \
  -o >(jq -r '.data[0].b64_json' | base64 --decode > gift-basket.png) \
  -X POST "https://api.openai.com/v1/images/edits" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -F "model=gpt-image-1" \
  -F "image[]=@body-lotion.png" \
  -F "image[]=@bath-bomb.png" \
  -F "image[]=@incense-kit.png" \
  -F "image[]=@soap.png" \
  -F 'prompt=Generate a photorealistic image of a gift basket on a white background labeled "Relax & Unwind" with a ribbon and handwriting-like font, containing all the items in the reference pictures'
```

### Edit an image using a mask (inpainting)

You can provide a mask to indicate which part of the image should be edited.

When using a mask with GPT Image, additional instructions are sent to the model to help guide the editing process accordingly.

Unlike with DALL·E 2, masking with GPT Image is entirely prompt-based. This means the model uses the mask as guidance, but may not follow its exact shape with complete precision.

If you provide multiple input images, the mask will be applied to the first image.

Responses API

Edit an image with a mask

```python
from openai import OpenAI
client = OpenAI()

fileId = create_file("sunlit_lounge.png")
maskId = create_file("mask.png")

response = client.responses.create(
    model="gpt-4o",
    input=[
        {
            "role": "user",
            "content": [
                {
                    "type": "input_text",
                    "text": "generate an image of the same sunlit indoor lounge area with a pool but the pool should contain a flamingo",
                },
                {
                    "type": "input_image",
                    "file_id": fileId,
                }
            ],
        },
    ],
    tools=[
        {
            "type": "image_generation",
            "quality": "high",
            "input_image_mask": {
                "file_id": maskId,
            },
        },
    ],
)

image_data = [
    output.result
    for output in response.output
    if output.type == "image_generation_call"
]

if image_data:
    image_base64 = image_data[0]
    with open("lounge.png", "wb") as f:
        f.write(base64.b64decode(image_base64))
```

```javascript
import OpenAI from "openai";
const openai = new OpenAI();

const fileId = await createFile("sunlit_lounge.png");
const maskId = await createFile("mask.png");

const response = await openai.responses.create({
  model: "gpt-4o",
  input: [
    {
      role: "user",
      content: [
        {
          type: "input_text",
          text: "generate an image of the same sunlit indoor lounge area with a pool but the pool should contain a flamingo",
        },
        {
          type: "input_image",
          file_id: fileId,
        }
      ],
    },
  ],
  tools: [
    {
      type: "image_generation",
      quality: "high",
      input_image_mask: {
        file_id: maskId,
      },
    },
  ],
});

const imageData = response.output
  .filter((output) => output.type === "image_generation_call")
  .map((output) => output.result);

if (imageData.length > 0) {
  const imageBase64 = imageData[0];
  const fs = await import("fs");
  fs.writeFileSync("lounge.png", Buffer.from(imageBase64, "base64"));
}
```

Image API

Edit an image with a mask

```python
from openai import OpenAI
client = OpenAI()

result = client.images.edit(
    model="gpt-image-1",
    image=open("sunlit_lounge.png", "rb"),
    mask=open("mask.png", "rb"),
    prompt="A sunlit indoor lounge area with a pool containing a flamingo"
)

image_base64 = result.data[0].b64_json
image_bytes = base64.b64decode(image_base64)

# Save the image to a file
with open("composition.png", "wb") as f:
    f.write(image_bytes)
```

```javascript
import fs from "fs";
import OpenAI, { toFile } from "openai";

const client = new OpenAI();

const rsp = await client.images.edit({
    model: "gpt-image-1",
    image: await toFile(fs.createReadStream("sunlit_lounge.png"), null, {
        type: "image/png",
    }),
    mask: await toFile(fs.createReadStream("mask.png"), null, {
        type: "image/png",
    }),
    prompt: "A sunlit indoor lounge area with a pool containing a flamingo",
});

// Save the image to a file
const image_base64 = rsp.data[0].b64_json;
const image_bytes = Buffer.from(image_base64, "base64");
fs.writeFileSync("lounge.png", image_bytes);
```

```bash
curl -s -D >(grep -i x-request-id >&2) \
  -o >(jq -r '.data[0].b64_json' | base64 --decode > lounge.png) \
  -X POST "https://api.openai.com/v1/images/edits" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -F "model=gpt-image-1" \
  -F "mask=@mask.png" \   
  -F "image[]=@sunlit_lounge.png" \
  -F 'prompt=A sunlit indoor lounge area with a pool containing a flamingo'
```

|Image|Mask|Output|
|---|---|---|
||||

Prompt: a sunlit indoor lounge area with a pool containing a flamingo

#### Mask requirements

The image to edit and mask must be of the same format and size (less than 50MB in size).

The mask image must also contain an alpha channel. If you're using an image editing tool to create the mask, make sure to save the mask with an alpha channel.

Add an alpha channel to a black and white mask

You can modify a black and white image programmatically to add an alpha channel.

Add an alpha channel to a black and white mask

```python
from PIL import Image
from io import BytesIO

# 1. Load your black & white mask as a grayscale image
mask = Image.open(img_path_mask).convert("L")

# 2. Convert it to RGBA so it has space for an alpha channel
mask_rgba = mask.convert("RGBA")

# 3. Then use the mask itself to fill that alpha channel
mask_rgba.putalpha(mask)

# 4. Convert the mask into bytes
buf = BytesIO()
mask_rgba.save(buf, format="PNG")
mask_bytes = buf.getvalue()

# 5. Save the resulting file
img_path_mask_alpha = "mask_alpha.png"
with open(img_path_mask_alpha, "wb") as f:
    f.write(mask_bytes)
```

Customize Image Output
----------------------

You can configure the following output options:

*   **Size**: Image dimensions (e.g., `1024x1024`, `1024x1536`)
*   **Quality**: Rendering quality (e.g. `low`, `medium`, `high`)
*   **Format**: File output format
*   **Compression**: Compression level (0-100%) for JPEG and WebP formats
*   **Background**: Transparent or opaque

`size`, `quality`, and `background` support the `auto` option, where the model will automatically select the best option based on the prompt.

### Size and quality options

Square images with standard quality are the fastest to generate. The default size is 1024x1024 pixels.

|Available sizes|1024x1024 (square)1536x1024 (landscape)1024x1536 (portrait)auto (default)|
|Quality options|lowmediumhighauto (default)|

### Output format

The Image API returns base64-encoded image data. The default format is `png`, but you can also request `jpeg` or `webp`.

If using `jpeg` or `webp`, you can also specify the `output_compression` parameter to control the compression level (0-100%). For example, `output_compression=50` will compress the image by 50%.

Using `jpeg` is faster than `png`, so you should prioritize this format if latency is a concern.

### Transparency

The `gpt-image-1` model supports transparent backgrounds. To enable transparency, set the `background` parameter to `transparent`.

It is only supported with the `png` and `webp` output formats.

Transparency works best when setting the quality to `medium` or `high`.

Responses API

Generate an image with a transparent background

```python
import openai
import base64

response = openai.responses.create(
    model="gpt-4.1-mini",
    input="Draw a 2D pixel art style sprite sheet of a tabby gray cat",
    tools=[
        {
            "type": "image_generation",
            "background": "transparent",
            "quality": "high",
        }
    ],
)

image_data = [
    output.result
    for output in response.output
    if output.type == "image_generation_call"
]

if image_data:
    image_base64 = image_data[0]

    with open("sprite.png", "wb") as f:
        f.write(base64.b64decode(image_base64))
```

```javascript
import fs from "fs";
import OpenAI from "openai";

const client = new OpenAI();

const response = await client.responses.create({
  model: "gpt-4.1-mini",
  input: "Draw a 2D pixel art style sprite sheet of a tabby gray cat",
  tools: [
    {
      type: "image_generation",
      background: "transparent",
      quality: "high",
    },
  ],
});

const imageData = response.output
  .filter((output) => output.type === "image_generation_call")
  .map((output) => output.result);

if (imageData.length > 0) {
  const imageBase64 = imageData[0];
  const imageBuffer = Buffer.from(imageBase64, "base64");
  fs.writeFileSync("sprite.png", imageBuffer);
}
```

Image API

Generate an image with a transparent background

```javascript
import OpenAI from "openai";
import fs from "fs";
const openai = new OpenAI();

const result = await openai.images.generate({
    model: "gpt-image-1",
    prompt: "Draw a 2D pixel art style sprite sheet of a tabby gray cat",
    size: "1024x1024",
    background: "transparent",
    quality: "high",
});

// Save the image to a file
const image_base64 = result.data[0].b64_json;
const image_bytes = Buffer.from(image_base64, "base64");
fs.writeFileSync("sprite.png", image_bytes);
```

```python
from openai import OpenAI
import base64
client = OpenAI()

result = client.images.generate(
    model="gpt-image-1",
    prompt="Draw a 2D pixel art style sprite sheet of a tabby gray cat",
    size="1024x1024",
    background="transparent",
    quality="high",
)

image_base64 = result.json()["data"][0]["b64_json"]
image_bytes = base64.b64decode(image_base64)

# Save the image to a file
with open("sprite.png", "wb") as f:
    f.write(image_bytes)
```

```bash
curl -X POST "https://api.openai.com/v1/images" \
    -H "Authorization: Bearer $OPENAI_API_KEY" \
    -H "Content-type: application/json" \
    -d '{
        "prompt": "Draw a 2D pixel art style sprite sheet of a tabby gray cat",
        "quality": "high",
        "size": "1024x1024",
        "background": "transparent"
    }' | jq -r 'data[0].b64_json' | base64 --decode > sprite.png
```

Limitations
-----------

The GPT Image 1 model is a powerful and versatile image generation model, but it still has some limitations to be aware of:

*   **Latency:** Complex prompts may take up to 2 minutes to process.
*   **Text Rendering:** Although significantly improved over the DALL·E series, the model can still struggle with precise text placement and clarity.
*   **Consistency:** While capable of producing consistent imagery, the model may occasionally struggle to maintain visual consistency for recurring characters or brand elements across multiple generations.
*   **Composition Control:** Despite improved instruction following, the model may have difficulty placing elements precisely in structured or layout-sensitive compositions.

### Content Moderation

All prompts and generated images are filtered in accordance with our [content policy](https://labs.openai.com/policies/content-policy).

For image generation using `gpt-image-1`, you can control moderation strictness with the `moderation` parameter. This parameter supports two values:

*   `auto` (default): Standard filtering that seeks to limit creating certain categories of potentially age-inappropriate content.
*   `low`: Less restrictive filtering.

### Supported models

When using image generation in the Responses API, the models that support calling this tool are:

*   `gpt-4o`
*   `gpt-4o-mini`
*   `gpt-4.1`
*   `gpt-4.1-mini`
*   `gpt-4.1-nano`
*   `o3`

Cost and latency
----------------

This model generates images by first producing specialized image tokens. Both latency and eventual cost are proportional to the number of tokens required to render an image—larger image sizes and higher quality settings result in more tokens.

The number of tokens generated depends on image dimensions and quality:

|Quality|Square (1024×1024)|Portrait (1024×1536)|Landscape (1536×1024)|
|---|---|---|---|
|Low|272 tokens|408 tokens|400 tokens|
|Medium|1056 tokens|1584 tokens|1568 tokens|
|High|4160 tokens|6240 tokens|6208 tokens|

Note that you will also need to account for [input tokens](/docs/guides/images-vision#gpt-image-1): text tokens for the prompt and image tokens for the input images if editing images.

So the final cost is the sum of:

*   input text tokens
*   input image tokens if using the edits endpoint
*   image output tokens

Refer to our [pricing page](/pricing#image-generation) for more information about price per text and image tokens.

### Partial images cost

If you want to [stream image generation](#streaming) with the Responses API using the `partial_images` parameter, each partial image will incur an additional 100 image output tokens.

Was this page useful?



Moderation
==========

Identify potentially harmful content in text and images.

Use the [moderations](/docs/api-reference/moderations) endpoint to check whether text or images are potentially harmful. If harmful content is identified, you can take corrective action, like filtering content or intervening with user accounts creating offending content. The moderation endpoint is free to use.

You can use two models for this endpoint:

*   `omni-moderation-latest`: This model and all snapshots support more categorization options and multi-modal inputs.
*   `text-moderation-latest` **(Legacy)**: Older model that supports only text inputs and fewer input categorizations. The newer omni-moderation models will be the best choice for new applications.

Quickstart
----------

Use the tabs below to see how you can moderate text inputs or image inputs, using our [official SDKs](/docs/libraries) and the [omni-moderation-latest model](/docs/models#moderation):

Moderate text inputs

Get classification information for a text input

```python
from openai import OpenAI
client = OpenAI()

response = client.moderations.create(
    model="omni-moderation-latest",
    input="...text to classify goes here...",
)

print(response)
```

```javascript
import OpenAI from "openai";
const openai = new OpenAI();

const moderation = await openai.moderations.create({
    model: "omni-moderation-latest",
    input: "...text to classify goes here...",
});

console.log(moderation);
```

```bash
curl https://api.openai.com/v1/moderations \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{
    "model": "omni-moderation-latest",
    "input": "...text to classify goes here..."
  }'
```

Moderate images and text

Get classification information for image and text input

```python
from openai import OpenAI
client = OpenAI()

response = client.moderations.create(
    model="omni-moderation-latest",
    input=[
        {"type": "text", "text": "...text to classify goes here..."},
        {
            "type": "image_url",
            "image_url": {
                "url": "https://example.com/image.png",
                # can also use base64 encoded image URLs
                # "url": "data:image/jpeg;base64,abcdefg..."
            }
        },
    ],
)

print(response)
```

```javascript
import OpenAI from "openai";
const openai = new OpenAI();

const moderation = await openai.moderations.create({
    model: "omni-moderation-latest",
    input: [
        { type: "text", text: "...text to classify goes here..." },
        {
            type: "image_url",
            image_url: {
                url: "https://example.com/image.png"
                // can also use base64 encoded image URLs
                // url: "data:image/jpeg;base64,abcdefg..."
            }
        }
    ],
});

console.log(moderation);
```

```bash
curl https://api.openai.com/v1/moderations \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{
    "model": "omni-moderation-latest",
    "input": [
      { "type": "text", "text": "...text to classify goes here..." },
      {
        "type": "image_url",
        "image_url": {
          "url": "https://example.com/image.png"
        }
      }
    ]
  }'
```

Here's a full example output, where the input is an image from a single frame of a war movie. The model correctly predicts indicators of violence in the image, with a `violence` category score of greater than 0.8.

```json
{
  "id": "modr-970d409ef3bef3b70c73d8232df86e7d",
  "model": "omni-moderation-latest",
  "results": [
    {
      "flagged": true,
      "categories": {
        "sexual": false,
        "sexual/minors": false,
        "harassment": false,
        "harassment/threatening": false,
        "hate": false,
        "hate/threatening": false,
        "illicit": false,
        "illicit/violent": false,
        "self-harm": false,
        "self-harm/intent": false,
        "self-harm/instructions": false,
        "violence": true,
        "violence/graphic": false
      },
      "category_scores": {
        "sexual": 2.34135824776394e-7,
        "sexual/minors": 1.6346470245419304e-7,
        "harassment": 0.0011643905680426018,
        "harassment/threatening": 0.0022121340080906377,
        "hate": 3.1999824407395835e-7,
        "hate/threatening": 2.4923252458203563e-7,
        "illicit": 0.0005227032493135171,
        "illicit/violent": 3.682979260160596e-7,
        "self-harm": 0.0011175734280627694,
        "self-harm/intent": 0.0006264858507989037,
        "self-harm/instructions": 7.368592981140821e-8,
        "violence": 0.8599265510337075,
        "violence/graphic": 0.37701736389561064
      },
      "category_applied_input_types": {
        "sexual": [
          "image"
        ],
        "sexual/minors": [],
        "harassment": [],
        "harassment/threatening": [],
        "hate": [],
        "hate/threatening": [],
        "illicit": [],
        "illicit/violent": [],
        "self-harm": [
          "image"
        ],
        "self-harm/intent": [
          "image"
        ],
        "self-harm/instructions": [
          "image"
        ],
        "violence": [
          "image"
        ],
        "violence/graphic": [
          "image"
        ]
      }
    }
  ]
}
```

The output has several categories in the JSON response, which tell you which (if any) categories of content are present in the inputs, and to what degree the model believes them to be present.

||
|flagged|Set to true if the model classifies the content as potentially harmful, false otherwise.|
|categories|Contains a dictionary of per-category violation flags. For each category, the value is true if the model flags the corresponding category as violated, false otherwise.|
|category_scores|Contains a dictionary of per-category scores output by the model, denoting the model's confidence that the input violates the OpenAI's policy for the category. The value is between 0 and 1, where higher values denote higher confidence.|
|category_applied_input_types|This property contains information on which input types were flagged in the response, for each category. For example, if the both the image and text inputs to the model are flagged for "violence/graphic", the violence/graphic property will be set to ["image", "text"]. This is only available on omni models.|

We plan to continuously upgrade the moderation endpoint's underlying model. Therefore, custom policies that rely on `category_scores` may need recalibration over time.

Content classifications
-----------------------

The table below describes the types of content that can be detected in the moderation API, along with which models and input types are supported for each category.

Categories marked as "Text only" do not support image inputs. If you send only images (without accompanying text) to the `omni-moderation-latest` model, it will return a score of 0 for these unsupported categories.

||
|harassment|Content that expresses, incites, or promotes harassing language towards any target.|All|Text only|
|harassment/threatening|Harassment content that also includes violence or serious harm towards any target.|All|Text only|
|hate|Content that expresses, incites, or promotes hate based on race, gender, ethnicity, religion, nationality, sexual orientation, disability status, or caste. Hateful content aimed at non-protected groups (e.g., chess players) is harassment.|All|Text only|
|hate/threatening|Hateful content that also includes violence or serious harm towards the targeted group based on race, gender, ethnicity, religion, nationality, sexual orientation, disability status, or caste.|All|Text only|
|illicit|Content that gives advice or instruction on how to commit illicit acts. A phrase like "how to shoplift" would fit this category.|Omni only|Text only|
|illicit/violent|The same types of content flagged by the illicit category, but also includes references to violence or procuring a weapon.|Omni only|Text only|
|self-harm|Content that promotes, encourages, or depicts acts of self-harm, such as suicide, cutting, and eating disorders.|All|Text and images|
|self-harm/intent|Content where the speaker expresses that they are engaging or intend to engage in acts of self-harm, such as suicide, cutting, and eating disorders.|All|Text and images|
|self-harm/instructions|Content that encourages performing acts of self-harm, such as suicide, cutting, and eating disorders, or that gives instructions or advice on how to commit such acts.|All|Text and images|
|sexual|Content meant to arouse sexual excitement, such as the description of sexual activity, or that promotes sexual services (excluding sex education and wellness).|All|Text and images|
|sexual/minors|Sexual content that includes an individual who is under 18 years old.|All|Text only|
|violence|Content that depicts death, violence, or physical injury.|All|Text and images|
|violence/graphic|Content that depicts death, violence, or physical injury in graphic detail.|All|Text and images|

Was this page useful?