---
title: Hello AI
date: 2023-04-11 20:37:56
tags: untagged
categories: Uncategorized
---

To start with: this is not an article that belittles AI. It is an article about the state of AI as I see it.

The arrival of ChatGPT has given birth to all kinds of AI tools, to the point where I have almost developed an AI migraine lately.

Every day you see a new AI tool. Pull back the curtain and you often find ChatGPT behind it. Some products simply tell you they have integrated ChatGPT, which makes you subjectively think of them as AI tools.

It can feel as if only ChatGPT can satisfy these needs, but let's think about it more carefully...

## AI Documentation

Take AI documentation as an example. The implementation usually looks something like this:

- Preprocess the existing documentation
- Vectorize it and store it in a vector database
- When the user asks a question, vectorize the question
- Search the vector database for the closest matches to that question vector
- Send the retrieved chunks to ChatGPT
- Return ChatGPT's summarized answer to the user

What we are really using here is ChatGPT's ability to summarize. But think about it: if we skipped the final step and built a tool like this, would it still be useful?

I think it would. In many scenarios, it might even be enough. It is hard for people to fully trust AI-generated results, and at this stage ChatGPT's summarization ability is still not always satisfying.

So for me, this kind of feature feels better than nothing, but not by much.

## AI Programming

This is the feature that excites me the most. Before ChatGPT appeared, I was writing a tool for generating unit test templates. It could already mock function declarations automatically and do a few other things. But once I saw ChatGPT, I gave up on it immediately. A tool like that no longer made sense in front of ChatGPT.

At this stage, AI programming will definitely make programmers more efficient, and there is no real possibility that it will replace programmers completely. Enjoy it while you can. In a few years, simple programming work may genuinely no longer need programmers.

## AI Writing

This is clearly a real need. Most people are probably not especially good at writing, translation, or similar language work. With AI, everyone can reach a much higher standard.

## AI Teacher

This is a very interesting use case. I use it to learn foreign languages and to ask about things where it is relatively easy to tell right from wrong. When you are learning a field you do not understand yet, it is probably better not to rely on AI for now, because you may not know whether it is making things up.
