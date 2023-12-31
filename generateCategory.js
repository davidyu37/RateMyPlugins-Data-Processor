import fs from "fs";
import { z } from "zod";
import { Document } from "langchain/document";
import dotenv from "dotenv";
import { OpenAI } from "langchain/llms/openai";
import { ChatOpenAI } from "langchain/chat_models/openai";
import {
  LLMChain,
  RetrievalQAChain,
  SequentialChain,
  createExtractionChainFromZod,
} from "langchain/chains";
import { PromptTemplate } from "langchain/prompts";
import { HNSWLib } from "langchain/vectorstores/hnswlib";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
const { config } = dotenv;
config();

const data = await fs.readFileSync("./data/plugins-20230630.json", "utf-8");
const parsed = JSON.parse(data);

const { items, count } = parsed;

const documents = items.map((item) => {
  const manifest = item.manifest;

  const content = `Plugin name: ${manifest.name_for_model}. Plugin description: ${manifest.description_for_model}`;

  return new Document({
    pageContent: content,
    metadata: {
      id: item.id,
      logo_url: manifest.logo_url,
      description: manifest.description_for_human,
      domain: item.domain,
      name: manifest.name_for_human,
    },
  });
});

const directory = "./vectors/";
// Create a vector store from the documents.
// const vectorStore = await HNSWLib.fromDocuments(documents, new OpenAIEmbeddings());
// await vectorStore.save(directory);

const vectorStore = await HNSWLib.load(directory, new OpenAIEmbeddings());

const model = new OpenAI({ temperature: 0 });

const retrievalChain = RetrievalQAChain.fromLLM(
  model,
  vectorStore.asRetriever()
);

const { text } = await retrievalChain.call({
  query:
    "Based on the similar clusters, what are the categories of the plugins? please provide a list of categories in this format '1. category1 2. category2 3. category3' Please provide 10 categories.",
});

// const text = '1. Styling and fashion advice 2. Product comparison and reviews 3. Media and entertainment recommendations 4. Extension recommendations 5. Creative and practical gift ideas 6. Advanced review analysis 7. Comprehensive rating scores 8. Trending data by genres 9. Ratings and reviews 10. Similar content.'

// console.log(text);

const formatChain = createExtractionChainFromZod(
  z.object({
    'category-name': z.string().optional(),
  }),
  new ChatOpenAI({ modelName: "gpt-3.5-turbo-0613", temperature: 0 })
);

const { text: formattedCategories } = await formatChain.call({ input: text })

// console.log(formattedCategories)

// const formattedCategories = [
//   { "category-name": "Styling and fashion advice" },
//   { "category-name": "Product comparison and reviews" },
//   { "category-name": "Media and entertainment recommendations" },
//   { "category-name": "Extension recommendations" },
//   { "category-name": "Creative and practical gift ideas" },
//   { "category-name": "Advanced review analysis" },
//   { "category-name": "Comprehensive rating scores" },
//   { "category-name": "Trending data by genres" },
//   { "category-name": "Ratings and reviews" },
//   { "category-name": "Similar content" },
//   { "category-name": "Smart Contract Workflows" },
// ];

// const docs = await vectorStore.similaritySearch("*", 1);
const docs = await vectorStore.similaritySearch("*", count);

const convertListToObject = (inputArray) => {
  let outputString = "";
  for (let i = 0; i < inputArray.length; i++) {
    outputString += i + 1 + ". " + inputArray[i]["category-name"] + " ";
  }
  return outputString.trim();
};

const getCategory = async (doc) => {
  const template = `Your job is to assign a category to the plugin given. If none of the categories make sense to assign, please createa a new one, and note that it is new. Return format as 'Name: pluginName, Category: categoryName, isNew: boolean' Plugin: {plugin} Categories: {categories}`;
  const prompt = new PromptTemplate({
    template,
    inputVariables: ["plugin", "categories"],
  });

  const promptChain = new LLMChain({
    llm: model,
    prompt: prompt,
    outputKey: "input",
  });

  const formatChain = createExtractionChainFromZod(
    z.object({
      "category-name": z.string().optional(),
      "plugin-name": z.string().optional(),
      "new-category": z.boolean().optional(),
    }),
    new ChatOpenAI({ modelName: "gpt-3.5-turbo-0613", temperature: 0 })
  );

  const overallChain = new SequentialChain({
    chains: [promptChain, formatChain],
    inputVariables: ["plugin", "categories"],
    verbose: true,
  });

  const categoriesString = convertListToObject(formattedCategories);

  const { text } = await overallChain.call({
    plugin: doc.pageContent,
    categories: categoriesString,
  });

  const result = text[0];

  if (result["new-category"]) {
    formattedCategories.push({
      "category-name": result["category-name"],
    });
  }

  return {
    ...doc,
    metadata: {
      ...doc.metadata,
      category: result["category-name"],
    },
  };
};

const getCategoryPromises = docs.map(getCategory);

const newDocs = await Promise.all(getCategoryPromises)

await fs.writeFileSync(
  "./output/newDocuments.json",
  JSON.stringify(newDocs, null, 4)
);
await fs.writeFileSync(
  "./output/categories.json",
  JSON.stringify(formattedCategories, null, 4)
);
