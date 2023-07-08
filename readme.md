# Plugin and Category Classification

This project categorizes plugins and stores them in Firebase Firestore. It uses data from a JSON file, processes it with the Langchain API, and uses OpenAI to generate categories and assign them to plugins. Once the plugins are processed, they are uploaded to Firestore along with their assigned categories.

## Pre-requisites

1. **Node.js**: Make sure you have Node.js installed. You can download it from [here](https://nodejs.org/).
2. **Firebase**: The project uses Firebase Firestore for storing data. Make sure you have a Firebase account and a Firestore database setup.
3. An `.env` file with your environment variables.
4. The `plugins-20230630.json` file located in the `./data/` directory. You can also replace it with the data that you get when visiting ChatGPT's plugin store. (ps: in the network tab of the console)

## Getting Started

1. **Clone the repository**

   ```bash
   git clone https://github.com/davidyu37/RateMyPlugins-Data-Processor.git
   cd RateMyPlugins-Data-Processor
2. **Install dependencies**
    ```bash 
    npm install
3. **Setup Firebase**
Download your Firebase Admin SDK service account JSON file and place it in the root directory. Rename it to firebase-adminsdk.json. 
4. **Setup Environment Variables**
The project uses a .env file for environment variables. Create a .env file in the root directory and setup your environment variables.
5. **Run the scripts**
- To run the script for processing and categorizing plugins:
```
node generateCategory.js
```
The results will be stored in ./output/newDocuments.json and ./output/categories.json.
- To upload the processed plugins and categories to Firestore:
```
node index.js
```
The results will be uploaded to your Firestore database under the plugins and categories collections respectively.

## Troubleshooting
If you encounter any problems during setup, please open an issue on this GitHub repository or contact the project maintainers directly.

## Contributing
Contributions, issues, and feature requests are welcome. Feel free to check the issues page if you want to contribute.