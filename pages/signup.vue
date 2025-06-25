<template>
  <div class="signup-form" id="mc_embed_shell">
    <h3>Subscribe to Updates from Reboot Democracy</h3>
    <div id="mc_embed_signup">
      <form
        action="https://innovate-us.us14.list-manage.com/subscribe/post?u=36f840aa1f979805ce7b81fa7&amp;id=cb864aff13&amp;f_id=003bf8e0f0"
        method="post"
        id="mc-embedded-subscribe-form"
        name="mc-embedded-subscribe-form"
        class="validate"
        target="_self"
        novalidate
        @submit.prevent="handleSubmit"
      >
        <div id="mc_embed_signup_scroll">
          <div class="indicates-required">
            <span class="asterisk">*</span> indicates required
          </div>
          <div class="mc-field-group">
            <label for="mce-EMAIL"
              >Email Address <span class="asterisk">*</span></label
            >
            <input
              type="email"
              name="EMAIL"
              class="required email"
              id="mce-EMAIL"
              required
              v-model="email"
              @input="validateEmail"
            />
            <div class="error-message" v-if="emailError">{{ emailError }}</div>
          </div>
          <div class="mc-field-group">
            <label for="mce-FNAME">First Name </label>
            <input
              type="text"
              name="FNAME"
              class="text"
              id="mce-FNAME"
              v-model="firstName"
            />
          </div>
          <div class="mc-field-group">
            <label for="mce-LNAME">Last Name </label>
            <input
              type="text"
              name="LNAME"
              class="text"
              id="mce-LNAME"
              v-model="lastName"
            />
          </div>
          <div class="mc-field-group">
            <label for="mce-MMERGE5">Affiliation </label>
            <input
              type="text"
              name="MMERGE5"
              class="text"
              id="mce-MMERGE5"
              v-model="affiliation"
            />
          </div>
          <div hidden="">
            <input type="hidden" name="tags" value="7345136" />
          </div>
          <div id="mce-responses" class="clear">
            <div
              class="response"
              id="mce-error-response"
              style="display: none"
            ></div>
            <div
              class="response"
              id="mce-success-response"
              style="display: none"
            ></div>
          </div>
          <div aria-hidden="true" style="position: absolute; left: -5000px">
            <input
              type="text"
              name="b_36f840aa1f979805ce7b81fa7_cb864aff13"
              tabindex="-1"
              v-model="honeypot"
            />
          </div>
          <div class="clear">
            <input
              type="submit"
              class="btn btn-primary btn-dark btn-medium"
              name="subscribe"
              id="mc-embedded-subscribe"
              value="Subscribe"
            />
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      email: "",
      firstName: "",
      lastName: "",
      affiliation: "",
      honeypot: "",
      emailError: "",
    };
  },
  methods: {
    validateEmail() {
      // Reset error first
      this.emailError = "";

      // Get the email value
      const emailValue = this.email.trim();

      // Check if email is empty
      if (emailValue === "") {
        this.emailError = "Email address is required";
        return false;
      }

      // Check if email is valid using a basic pattern
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(emailValue)) {
        this.emailError = "Please enter a valid email address";
        return false;
      }

      return true;
    },
    handleSubmit(event) {
      // Validate before submission
      if (!this.validateEmail()) {
        event.preventDefault();
        return;
      }

      // If validation passes, submit the form
      const form = event.target;
      form.submit();
    },
  },
};
</script>

<style scoped>
.signup-form {
  max-width: 600px;
  margin: 4rem auto;
  padding: 3rem 2rem;
  border: 1px solid #000;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
  font-family: var(--font-inria);
}

.signup-form h3 {
  font-family: var(--font-inter);
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 2rem;
  text-align: center;
  color: #003366;
}

.indicates-required {
  font-size: 0.85rem;
  margin-bottom: 1.5rem;
  color: #003366;
  font-family: var(--font-inria);
}

.mc-field-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.mc-field-group label {
  font-weight: 600;
  font-size: 1rem;
  font-family: var(--font-inria);
  color: #003366;
}

.mc-field-group input[type="text"],
.mc-field-group input[type="email"] {
  padding: 0.6rem 0.75rem;
  font-size: 1rem;
  font-family: var(--font-inria);
  background-color: #fff;
  border: 1px solid #000;
  border-radius: 4px;
  transition: border 0.3s ease;
}

.mc-field-group input:focus {
  outline: none;
  border-color: var(--blue-action);
}

.asterisk {
  color: var(--peach-text);
}

.clear input[type="submit"] {
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.09em;
  text-decoration: none;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: var(--font-inter);
  color: #FFFFFF;
  background: #fc6423;
  border: 1px solid #000000;
  border-radius: 6px;
  padding: 0.75rem 1.5rem;
  margin-top: 1.5rem;
  width: 100%;
  transition: background 0.3s ease;
  cursor: pointer;
}

.clear input[type="submit"]:hover {
  background-color: #f0ccbd;
  color: #fc6423;
}

.response {
  font-size: 0.9rem;
  margin-top: 1rem;
  font-family: var(--font-inria);
}

#mce-error-response {
  color: var(--peach-text);
}

#mce-success-response {
  color: var(--teal-text);
}

.error-message {
  color: #ff6666;
  font-size: 0.85rem;
  margin-top: 0.25rem;
}

@media (max-width: 768px) {
  .signup-form {
    padding: 2rem 1rem;
  }

  .mc-field-group input {
    width: 100%;
  }
}
</style>
