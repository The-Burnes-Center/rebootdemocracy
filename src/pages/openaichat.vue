<script>
import { marked } from "marked";
import axios from "axios";

import HeaderComponent from "../components/header.vue";
import FooterComponent from "../components/footer.vue";
import MailingListComponent from "../components/mailing.vue";

export default {
  components: {
    "header-comp": HeaderComponent,
    "footer-comp": FooterComponent,
    "mailing-list-comp": MailingListComponent,
  },
  data() {
    return {
      openai: null,
      thread: null,
      threadId: null,
      currentQuestion: null,
      userAnswer: "",
      userAnswers: [],
      messages: [
        {
          id: Date.now(),
          content:
            "Hi, ask me anything about how to reboot democracy with AI. As an inspiration, choose one of the sample prompts below!",
        },
      ],
      quizQuestions: [],
      isQuizAnswered: false,
      isLoading: true,
      initMessage: null,
      initMessageFeedback:0,
      responsePromiseResolve: null,

      assistantId: "asst_XBK7BcSwGLtDv4PVvN5nKFaB", // Reboot Democracy Tutor ID - Replace with your assistant ID
    };
  },
  methods: {
    parsedMarkdown(content) {
      return marked(content);
    },
    submitSamplePrompt(promptKey){
      // Your function logic here
      // You can use a switch or an object map to get the actual text from the promptKey
      const prompts = {
        enlistHelp: "I'm trying to enlist my community's help in identifying a problem, how might I go about it?",
        askExperts: "What's the best way to ask industry experts for help with solving a problem?",
        environmentEngagement: "What are examples of successful engagements relating to the environment?",
        parliamentEngagement: "How can a parliament create more public engagement in lawmaking?"
      };
      const promptText = prompts[promptKey];
      this.userInput = promptText;
      this.sendUserQuestion();

      console.log(promptText); // Replace with actual submission logic
    },
    async displayQuiz(title, questions) {
      this.quizQuestions = questions;

      const responses = [];

      for (const question of questions) {
        let response = "";

        // if multiple choice, print options
        if (question["question_type"] === "MULTIPLE_CHOICE") {
          const choicesString = question["choices"]
            .map((choice, i) => `${i+1}. ${choice}\n `)
            .join("\n");
          const rLineQn = `**Choice question**: ${question["question_text"]} \n\n *Options*:\n${choicesString}\n
      `;

          this.initMessage = {
            id: Date.now(),
            content: rLineQn,
            type: "openai",
          };
          this.updateMessagesAndScroll(this.initMessage);
          response = await this.waitForUserResponse();
          // console.log("MULTIPLE_CHOICE");
        } else if (question["question_type"] === "FREE_RESPONSE") {
          const rLineQn = `**Free response question**: ${question["question_text"]}\n
      `;

          this.initMessage = {
            id: Date.now(),
            content: rLineQn,
            type: "openai",
          };
          this.updateMessagesAndScroll(this.initMessage);
          response = await this.waitForUserResponse();
          // console.log("FREE_RESPONSE");
        }

        responses.push(response);
        this.initMessage = null;
      }
      // console.log("Your responses from the quiz:\n", responses);
      return responses;
    },
    async displayTheGovlabBlog(queries) {
      this.blogQueries = queries;

      // const responses = [];

      // for (const query of blogQueries) {
      //   let response = "";

      //   // if multiple choice, print options
      //   if (question["question_type"] === "MULTIPLE_CHOICE") {
      //     const choicesString = question["choices"]
      //       .map((choice, i) => `${i+1}. ${choice}\n `)
      //       .join("\n");
      //     const rLineQn = `**Choice question**: ${question["question_text"]} \n\n *Options*:\n${choicesString}\n
      // `;

      //     this.initMessage = {
      //       id: Date.now(),
      //       content: rLineQn,
      //       type: "openai",
      //     };
      //     this.updateMessagesAndScroll(this.initMessage);
      //     response = await this.waitForUserResponse();
      //     // console.log("MULTIPLE_CHOICE");
      //   } else if (question["question_type"] === "FREE_RESPONSE") {
      //     const rLineQn = `**Free response question**: ${question["question_text"]}\n
      // `;

      //     this.initMessage = {
      //       id: Date.now(),
      //       content: rLineQn,
      //       type: "openai",
      //     };
      //     this.updateMessagesAndScroll(this.initMessage);
      //     response = await this.waitForUserResponse();
      //     // console.log("FREE_RESPONSE");
      //   }

      //   responses.push(response);
      //   this.initMessage = null;
      // }
      // // console.log("Your responses from the quiz:\n", responses);
      // return responses;
    },
    handleSubmit() {
      // When the user clicks submit, resolve the promise with the user input

      if (this.initMessage != null) {
        this.updateMessagesAndScroll({
          id: Date.now(),
          content: this.userInput,
          type: "user",
        });

        if (this.responsePromiseResolve) {
          this.responsePromiseResolve(this.userInput);
          this.userInput = ""; // Clear the input field
          this.responsePromiseResolve = null; // Reset the resolver
        }
      } else {
        this.sendUserQuestion();
      }
    },
    waitForUserResponse() {
      // Return a promise that will be resolved when the user clicks submit
      return new Promise((resolve) => {
        this.responsePromiseResolve = resolve;
      });
    },

    updateMessagesAndScroll(newMessage) {
      this.isLoading = false;
      this.isQuizAnswered = true;

      this.messages.push(newMessage);

      this.$nextTick(() => {
        this.scrollToBottom();
      });
      // this.saveMessageToDatabase(newMessage, this.threadId, this.runId, newMessage.type);
    },

    scrollToBottom() {
      const chatWindow = this.$refs.chatWindow;
      if (chatWindow) {
        // Get the last message element
        const messages = chatWindow.getElementsByClassName("message");
        const lastMessage = messages[messages.length - 1];

        if (lastMessage) {
          // Calculate the position to scroll to
          // This is the offset top of the last message minus half the height of the chat window
          const scrollPosition =
            lastMessage.offsetTop - chatWindow.offsetHeight / 2;
          chatWindow.scrollTop = scrollPosition > 0 ? scrollPosition : 0;
        }
      }
    },

    handleQuizCompletion() {
      // Handle the completion of the quiz
      this.messages.push({
        id: Date.now(),
        content: "Quiz completed. Thank you for your responses!",
      });
    },
    async startChat() {
      this.isQuizAnswered = true;
      this.isLoading = false;
    },

    async startQuiz() {
      const initialQuestion =
      "Make a quiz with 2 questions: One open-ended, one multiple choice. Then, give me feedback for the responses.";        
      await this.sendOpenAIMessage(initialQuestion);
    },

    async makePromptSugesstions() {
      const promptSuggestions =
      "Provide 2-3 prompt suggestions for the user on how one can use technology to create effective and equitable engagements in a participatory democracy.";
      await this.sendOpenAIMessage(promptSuggestions);
    },

    async crawlBlogInfos() {
      const promptSuggestions =
      "I'm trying to enlist my community's help in identifying a problem, how might I go about it?";
      await this.sendOpenAIMessage(promptSuggestions);
    },

    async createOpenAIThread() {
      const response = await axios.post("/.netlify/functions/openai-handler", {
        action: "createThread",
      });
      this.threadId = response.data.id; // Assuming the thread ID is in the response
      this.startChat();
      // this.startQuiz();
      // this.crawlBlogInfos();
      // other handling
    },

    async sendUserQuestion() {
      if (this.userInput.trim()) {
        this.updateMessagesAndScroll({
          id: Date.now(),
          content: this.userInput,
          type: "user",
        });
        this.isLoading = true;
        await this.sendOpenAIMessage(this.userInput);
      }
    },

    async sendOpenAIMessage(messageContent) {
      this.userInput = ""; // Clear the input to prevent repeat

      await axios.post("/.netlify/functions/openai-handler", {
        action: "sendMessage",
        data: {
          threadId: this.threadId,
          message: { role: "user", content: messageContent },
        },
      });

      this.isQuizAnswered = true;
      await this.processOpenAIResponse();
    },

    async processOpenAIResponse() {
      const run = await this.createOpenAIRun({
        assistant_id: this.assistantId,
      });

      let actualRun = await this.retrieveOpenAIRun(run.id);
      console.log(actualRun.status);

      while (
        actualRun.status === "queued" ||
        actualRun.status === "in_progress" ||
        actualRun.status === "requires_action" 
      ) {
        if (actualRun.status === "requires_action") {

        //   // Handle the action required by the assistant
          
          const toolCall =
            actualRun.required_action?.submit_tool_outputs?.tool_calls[0];
          var name = toolCall?.function.name;
          const args = JSON.parse(toolCall?.function?.arguments || "{}");
          var questions = args.questions;   
          // console.log(toolCall)
          
        //   /// handle which function to call based on the reply which tool to use 
        //   // if(name == "display_quiz")
        //   // {
           
        //   // this.initMessageFeedback = 0;
        //   // //  displayQuizs is a method that displays the quiz and collects responses at first
        //   // var responses = await this.displayQuiz(
        //   //   name || "cool quiz",
        //   //   questions
        //   // );

        //   // } 
        //   // else if(name == "crawl_thegovlab_blog")
        //   // {
        //   //   const queries = args.blog_items;
        //   //   var responses = await this.displayTheGovlabBlog(
        //   //   queries
        //   // );
        //   // }
          
        //   this.isLoading = true;

        //   // Submit the tool outputs to continue
          await this.submitOpenAIToolOutputs(run.id, {
            tool_outputs: [
              {
                tool_call_id: toolCall?.id,
                output: JSON.stringify({ args }), // Make sure this is correctly formatted
              },
            ],
          });
        }

        // Wait for a while before checking the status again
        await new Promise((resolve) => setTimeout(resolve, 2000));
        actualRun = await this.retrieveOpenAIRun(run.id);
        console.log(actualRun.status)
      }
      console.log(actualRun.status);
      

      // Process the final response from OpenAI
      const messagesOAI = await this.listOpenAIMessages();

      const lastMessageForRun = messagesOAI.data
        .filter(
          (message) => message.run_id === run.id && message.role === "assistant"
        )
        .pop();
              // Check if this is the first feedback for retrieving suggesting prompts 

      // if (lastMessageForRun && (this.initMessageFeedback == 0 || this.initMessageFeedback == 2)) {

        // Regular expression to match the pattern for a source string
      // \【 and \】 escape the brackets, \d+ matches one or more digits, and \† escapes the dagger
      const pattern = /\【.*?†source】/g;
      let lastMessageForRunSanitized = lastMessageForRun.content[0].text.value.replace(pattern, '');

        this.updateMessagesAndScroll({
          id: lastMessageForRun.id,
          content: lastMessageForRunSanitized,
          type: "openai",
        });
      // } 
      // else if (lastMessageForRun && this.initMessageFeedback == 1)
      // {
      //   this.initMessageFeedback = 2;
      //   const promptSuggestionsContent = 
      //   "\nChoose one of the following conversation topics to continue the conversation: \n"+lastMessageForRun.content[0].text.value;
        
      //   this.messages.push({id: lastMessageForRun.id, content: promptSuggestionsContent, type: "openai"});
        
        // this.saveMessageToDatabase(promptSuggestionsContent, this.threadId, "openai");
      // }

      // if(this.initMessageFeedback==0) 
      //   {
      //     this.initMessageFeedback = 1;
      //     // await this.makePromptSugesstions();
      //   };


    },

    async createOpenAIRun(runData) {
      const response = await axios.post("/.netlify/functions/openai-handler", {
        action: "createRun",
        data: { threadId: this.threadId, runData },
      });
      // handle the response
      return response.data;
    },
    async retrieveOpenAIRun(runId) {
      const response = await axios.post("/.netlify/functions/openai-handler", {
        action: "retrieveRun",
        data: { threadId: this.threadId, runId },
      });
      // handle the response
      return response.data;
    },
    async submitOpenAIToolOutputs(runId, toolOutputs) {
      const response = await axios.post("/.netlify/functions/openai-handler", {
        action: "submitToolOutputs",
        data: { threadId: this.threadId, runId, toolOutputs },
      });
      // handle the response
    },
    async listOpenAIMessages() {
      const response = await axios.post("/.netlify/functions/openai-handler", {
        action: "listMessages",
        data: { threadId: this.threadId },
      });
      // handle the response
      return response.data;
    },

    async saveMessageToDatabase(message, threadId, runId, chatPersona) {
      const openaiId = chatPersona === "openai" ? message.id : null;
      try {
        const result = await axios.post("/.netlify/functions/openai-report-directus", {
          message: { content: message.content }, // Sending only the content part
          threadId,
          runId,
          chatPersona,
          openaiId
        });

        return {
      body: JSON.stringify({ message: 'Item created in Directus', data: result })
    };
        // Optionally handle the response or errors
      } catch (error) {
        console.error("Error saving message to database:", error);
      }
    },
  },
  mounted() {
    this.createOpenAIThread(); // Initialize OpenAI thread on component mount
  },
};
</script>

<template>
  <!-- 
  This events page is driven by the following collections and is concatenated for the purpose of showing all events. If more event sources are added, this list should be udpated.
- All items tagged as event under Reboot Democracy 
- All InnovateUS Workshops  
-->

  <!-- Header Component -->
  <!-- <header-comp></header-comp> -->

  <div class="assitant-chat">
    <h2>RebootDemocracy.AI - OpenAI Assistant</h2>
    <div v-if="!isQuizAnswered">
      <button>Loading...</button>
    </div>
    <div v-else>
      <div>
        <div class="chat-window" ref="chatWindow">
          <div
            v-for="message in messages"
            :key="message.id"
            :class="['message', message.type]"
            v-html="parsedMarkdown(message.content)"
          ></div>
        </div>
        <div class="button-grid">
      <button class="prompt-button" @click="submitSamplePrompt('enlistHelp')">I'm trying to enlist my community's help in identifying a problem, how might I go about it?</button>
      <button class="prompt-button" @click="submitSamplePrompt('askExperts')">What's the best way to ask industry experts for help with solving a problem?</button>
      <button class="prompt-button" @click="submitSamplePrompt('environmentEngagement')">What are examples of successful engagements relating to the environment?</button>
      <button class="prompt-button" @click="submitSamplePrompt('parliamentEngagement')">How can a parliament create more public engagement in lawmaking?</button>
    </div>
        <textarea
          v-model="userInput"
          placeholder="Your entry"
          @keyup.enter="handleSubmit"
          class="chat-input"
        />
        <br />
        <button @click="handleSubmit" class="btn btn-small btn-primary">
          Submit
        </button>
        <div v-if="isLoading" class="loader"></div>
        <br />
      </div>
    </div>
  </div>

  <!-- <footer-comp></footer-comp> -->
</template>
<style>
.button-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr); /* 2x2 grid */
  grid-gap: 10px;
  margin-bottom:20px;
}

.prompt-button {
  padding: 5px;
  background-color: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  font-size: 0.75rem; /* Smaller font size */
}

.prompt-button:hover {
  background-color: #daf7a6;
}

.chat-window {
  max-height: 900px;
  height: 520px;
  overflow-y: auto;
  border: 1px solid #ccc;
  margin-bottom: 10px;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.message {
  margin-bottom: 5px;
  padding: 5px;
  border-radius: 4px;
  background-color: #daf7a6;
  width: 65%;
  margin-bottom: 10px;
}

.message.user {
  background-color: #a6b2f7;
  text-align: right;
  width: 65%;
  align-self: flex-end;
}

@media screen and (max-width: 767px) {
  .message {
 
 width: 85%;

}

.message.user {
 width: 85%;
}
}



.message.assistant {
  background-color: #ffcccb; /* Light red background for assistant messages */
  text-align: left;
}
.chat-input {
  border: 1px solid #ccc;
  background-color: #ffffff;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  width: -moz-fit-content;
  width: 100%;
  height: inherit;
  padding: 10px 60px;
  min-height: 55px;
  font-family: "Space Mono", monospace;
  gap: 20px;
  z-index: 1000;
}
.loader {
  border: 5px solid #f3f3f3; /* Light grey */
  border-top: 5px solid #04787f; /* Blue */
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 2s linear infinite;
  float: right;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
