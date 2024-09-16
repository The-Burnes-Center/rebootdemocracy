



<script>
import { ref, watch } from "vue";
import { Directus } from "@directus/sdk";
import format from "date-fns/format";
import isPast from "date-fns/isPast";
import isFuture from "date-fns/isFuture";


// import { $vfm, VueFinalModal, ModalsContainer } from 'vue-final-modal'
import OpenAI from "openai";
import { marked } from 'marked';


import HeaderComponent from "../components/header.vue";
import FooterComponent from "../components/footer.vue";
import MailingListComponent from "../components/mailing.vue";
// import { register } from 'swiper/element/bundle';
// import {useHead } from '@vueuse/head'

export default {
  components: {
    "header-comp": HeaderComponent,
    "footer-comp": FooterComponent,
    "mailing-list-comp": MailingListComponent,
    // "vue-markdown":VueMarkdown
    

    //   "generative-ai-banner-comp":GenerativeAIBannerComponent,
    //   "ws-banner":WsBanner,
    //       VueFinalModal,
    //   ModalsContainer,
    //   ModalComp,
  },
  data() {
    return {
      openai: null,
      thread: null,
      currentQuestion: null,
      userAnswer: '',
      userAnswers:[],
      messages: [],
      quizQuestions: [],
      isQuizAnswered: false,
      
      assistantId: "asst_XBK7BcSwGLtDv4PVvN5nKFaB", // Replace with your assistant ID
    };
  },
  methods: {
        parsedMarkdown(content) {
      return marked(content);
    },
    async displayInfos(title, questions) {
      this.quizQuestions = questions;
      this.nextQuestion();
    },

    scrollToBottom() {
      const chatWindow = this.$refs.chatWindow;
      chatWindow.scrollTop = chatWindow.scrollHeight;
    },

    updateMessagesAndScroll(newMessage) {
      this.messages.push(newMessage);
      this.$nextTick(() => {
        this.scrollToBottom();
      });
    },

    nextQuestion() {
      if (this.quizQuestions.length > 0) {
        console.log(this.quizQuestions.length)
        this.currentQuestion = this.quizQuestions.shift();
      } else {
        this.isQuizAnswered = true;

        this.handleQuizCompletion();
      }
    },

    submitAnswer() {
      if (this.userAnswer.trim()) {
        this.userAnswers.push(this.userAnswer);
        this.userAnswer = '';

        if (this.quizQuestions.length > 0) {
        this.nextQuestion();
      }
       this.messages.push({ id: Date.now(), content: this.userAnswer, type: 'user' });
      // Process the user's answer and call sendToOpenAI or other methods as needed
      this.currentQuestion = null;
      this.userAnswer = '';
      }
      // You might want to store the user's answer and send it to OpenAI
    },

    handleQuizCompletion() {
      // Handle the completion of the quiz
      this.messages.push({ id: Date.now(), content: "Quiz completed. Thank you for your responses!" });
    },
    async initializeOpenAI() {
      const secretKey = process.env.OPENAI_API_KEY; // Ensure your API key is stored in an environment variable
      
      this.openai = new OpenAI({
        apiKey: secretKey,
        dangerouslyAllowBrowser: true,
      });
      this.thread = await this.openai.beta.threads.create();
      this.startQuiz()
    },
    async startQuiz() {
      const initialQuestion =
        "Make a quiz with 2 questions: One open-ended, one multiple choice. Then, give me feedback for the responses.";
      await this.sendToOpenAI(initialQuestion);
    },
    async sendUserQuestion() {
      if (this.userInput.trim()) {
        this.updateMessagesAndScroll({ id: Date.now(), content: this.userInput, type: 'user' });
        
        await this.sendToOpenAI(this.userInput);
        this.userInput = ""; // Clear the input to prevent repeat
      }
    },
    async sendToOpenAI(question) {
      await this.openai.beta.threads.messages.create(this.thread.id, {
        role: "user",
        content: question,
      });

      await this.pollForResponse();
    },
    async pollForResponse() {
  let run = await this.openai.beta.threads.runs.create(this.thread.id, {
    assistant_id: this.assistantId,
  });

  let actualRun = await this.openai.beta.threads.runs.retrieve(this.thread.id, run.id);

  while (actualRun.status === "queued" || actualRun.status === "in_progress" || actualRun.status === "requires_action") {
    if (actualRun.status === "requires_action") {
      // Handle the action required by the assistant
      const toolCall = actualRun.required_action?.submit_tool_outputs?.tool_calls[0];
      const name = toolCall?.function.name;
      const args = JSON.parse(toolCall?.function?.arguments || "{}");
      const questions = args.questions;

      // Assuming displayInfos is a method that displays the quiz and collects responses
      const responses = await this.displayInfos(name || "cool quiz", questions);
      console.log(responses)
      // Submit the tool outputs to continue
      await this.openai.beta.threads.runs.submitToolOutputs(this.thread.id, run.id, {
    tool_outputs: [
      {
        tool_call_id: toolCall?.id,
        output: JSON.stringify({ responses }), // Make sure this is correctly formatted
      },
    ],
  });

      // Mark the quiz as answered
      this.isQuizAnswered = true;
    }

    // Wait for a while before checking the status again
    await new Promise(resolve => setTimeout(resolve, 2000));
    actualRun = await this.openai.beta.threads.runs.retrieve(this.thread.id, run.id);
  }

  // Process the final response from OpenAI
  const messages = await this.openai.beta.threads.messages.list(this.thread.id);
  const lastMessageForRun = messages.data.filter(message => message.run_id === run.id && message.role === "assistant").pop();
  if (lastMessageForRun) {
    this.messages.push({ id: lastMessageForRun.id, content: lastMessageForRun.content[0].text.value });
  }
},

    async continueConversation() {
      const continueAsking = this.userInput.toLowerCase().includes("yes");
      if (continueAsking) {
        this.isQuizAnswered = false;
        this.startQuiz();
      } else {
        this.messages.push({
          id: Date.now(),
          content: "Alrighty then, I hope you learned something!",
        });
        this.userInput = "";
      }
    },
  },
  mounted() {
    this.initializeOpenAI();
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
  <header-comp></header-comp>

  <div class="resource-description">
    <h1>Participatory Democracy Assistant</h1>
    <div v-if="!isQuizAnswered">
      <button @click="startQuiz">Starting Quiz...</button>
    </div>
    <div v-else>
      <!-- <div v-if="currentQuestion">
      {{ currentQuestion }}
        <p>{{ currentQuestion.question_text }}</p>
        <div v-if="currentQuestion.question_type === 'MULTIPLE_CHOICE'">
          <div v-for="choice in currentQuestion.choices" :key="choice">
            <label>
              <input type="radio" :value="choice" v-model="userAnswer" /> {{ choice }}
            </label>
          </div>
        </div>
        <div v-else>
          <input v-model="userAnswer" placeholder="Your answer" @keyup.enter="submitAnswer" />
        </div>
        <button @click="submitAnswer">Submit Answer</button>
      </div> -->
      <div>
        <div class="chat-window" ref="chatWindow">
          <div v-for="message in messages" :key="message.id" :class="['message', message.type]" v-html="parsedMarkdown(message.content)">
           
          </div>
        </div>
        <textarea v-model="userInput" placeholder="Your entry" @keyup.enter="sendUserQuestion" class="chat-input"/>
        <br>
        <button @click="sendUserQuestion" class="btn btn-small btn-primary">Submit</button>
        <br> <br>
        <button @click="continueConversation" class="btn btn-small btn-primary">Continue Conversation</button>
      </div>
    </div>
  </div>

  <footer-comp></footer-comp>
</template>
<style>
.chat-window {
  max-height: 400px;
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
  margin-bottom:10px;
    
}

.message.user {
  background-color: #a6b2f7;
    text-align: right;
    width: 60%;
    align-self: flex-end;
}

.message.assistant {
  background-color: #ffcccb; /* Light red background for assistant messages */
  text-align: left;
}
.chat-input{
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
    font-family: 'Space Mono', monospace;
    gap: 20px;
    z-index: 1000;
}
</style>
