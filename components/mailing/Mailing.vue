<!-- <p>Mailing viewt</p> -->
<template>
  <div class="mailing-list-section">
    <div class="mailing-list-row">
      <div class="col-50">
        <h3>
          Sign up for the Reboot Democracy Mailing List to Learn about Upcoming
          Events
        </h3>
        <!-- <p>Click Below to Register for a Specific Event</p> -->
      </div>
      <div class="col-50">
        <!-- <p>Join our mailing list</p> -->
        <!-- <input type="text" placeholder="" name="entry.250007595" aria-hidden="true"> -->
        <a href="/signup" class="btn btn-primary btn-dark btn-medium"
          >Sign up to receive updates!</a
        >
      </div>
    </div>
  </div>
</template>

<style>
@import url("https://fonts.googleapis.com/css2?family=Red+Hat+Text:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap");

:root {
  --purple-icon: rgba(219, 198, 254, 1);
  --yellow-action: rgba(255, 180, 70, 1);
}
.mailing-list-section {
  display: flex;
  flex-direction: row;
  width: 100%;
  background-color: var(--purple-icon);
}

.mailing-list-section h3 {
  font-family: var(--font-sora);
  font-size: 24px;
  margin: 0;
}

.mailing-list-row {
  padding: 2rem 5rem;
  display: flex;
  flex-direction: row;
  width: 100%;
}

.col-50 {
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 50%;
  gap: 10px;
}

/* Button styles */
a.btn {
  font-size: 1rem;
  margin: 0;
  font-weight: 700;
  text-decoration: none;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  font-family: var(--font-habibi);
  color: #ffffff;
  border: none;
}

.btn-primary {
  color: #ffffff;
  background: #fc6423!important;
}
.btn-medium {
  width: fit-content;
  min-height: 42px;
  padding: 0 15px;
  height: 42px;
}

/* Responsive styles */
@media (max-width: 768px) {
  .mailing-list-section {
    flex-direction: column;
    width: 100%;
  }

  .mailing-list-row {
    padding: 1rem;
    flex-direction: column;
    width: fit-content;
  }

  .col-50 {
    flex-direction: column;
    width: 100%;
  }

  .col-50 input {
    width: 100%;
  }
}
</style>
