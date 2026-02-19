const { CIRCUIT_BREAKER } = require("../config/constants");

class CircuitBreaker {
  constructor() {
    this.state = "CLOSED";

    this.failureCount = 0;
    this.lastFailureTime = null;

    // ⭐ prevents HALF_OPEN storm
    this.halfOpenInProgress = false;
  }

  /* ---------------------------------------------------
     SUCCESS HANDLING
  --------------------------------------------------- */
  recordSuccess() {
    this.failureCount = 0;
    this.state = "CLOSED";
    this.halfOpenInProgress = false;

    console.log("🟢 Circuit CLOSED — backend healthy");
  }

  /* ---------------------------------------------------
     FAILURE HANDLING
  --------------------------------------------------- */
  recordFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= CIRCUIT_BREAKER.FAILURE_THRESHOLD) {
      if (this.state !== "OPEN") {
        this.state = "OPEN";
        this.halfOpenInProgress = false;

        console.log("🔴 Circuit OPEN — backend blocked");
      }
    }
  }

  /* ---------------------------------------------------
     REQUEST CHECK
  --------------------------------------------------- */
  canRequest() {
    // CLOSED → everything allowed
    if (this.state === "CLOSED") {
      return true;
    }

    // OPEN → wait reset timeout
    if (this.state === "OPEN") {
      const now = Date.now();

      if (
        now - this.lastFailureTime >
        CIRCUIT_BREAKER.RESET_TIMEOUT
      ) {
        this.state = "HALF_OPEN";
        this.halfOpenInProgress = false;

        console.log("🟡 Circuit HALF_OPEN — testing backend");
      } else {
        return false;
      }
    }

    /* ---------------------------------------------------
       HALF_OPEN LOGIC (IMPORTANT)
       Allow ONLY ONE request
    --------------------------------------------------- */
    if (this.state === "HALF_OPEN") {
      if (this.halfOpenInProgress) {
        return false;
      }

      this.halfOpenInProgress = true;
      return true;
    }

    return false;
  }

  getState() {
    return this.state;
  }
}

module.exports = new CircuitBreaker();
