

<template>
  <div class="mailing-list-section">
    <div class="mailing-list-row">
      <div class="col-50">
        <h3>Sign up for the Reboot Democracy Mailing List to Learn about Upcoming Events</h3>
        <!-- <p>Click Below to Register for a Specific Event</p> -->
      </div>
      <div class="col-50">
        <!-- <p>Join our mailing list</p> -->
        <!-- <input type="text" placeholder="" name="entry.250007595" aria-hidden="true"> -->
        <a href="/signup" class="btn btn-primary btn-dark btn-medium">Sign up to receive updates!</a>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Mailing list section styles */
.mailing-list-section {
  display: flex;
  flex-direction: row;
  width: 100%;
  background-color: rgba(219, 198, 254, 1);
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
  font-size: 0.8rem;
  margin: 0;
  font-weight: 700;
  letter-spacing: 0.09em;
  text-decoration: none;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  font-family: 'Space Mono', monospace;
  color: #000000;
}

.btn-primary {
  color: #ffffff;
  background: var(--yellow-action) !important;
  border: 1px solid #000000;
}

.btn-dark {
  color: #000000 !important;
}

.btn-medium {
  width: fit-content;
  min-height: 42px;
  padding: 0 15px;
  height: 42px;
}

/* CSS Variables imported from main CSS */
:root {
  --purple-icon: rgba(219, 198, 254, 1);
  --yellow-action: rgba(255, 180, 70, 1);
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