"use strict";

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");
const workoutsHistory = document.querySelector(".workouts .workoutsHistory");

class Workout {
  month = months[new Date().getMonth()];
  day = new Date().getDate();
  id = Date.now();

  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }
}

class Running extends Workout {
  type = "running";

  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
  }

  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = "cycling";

  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

class App {
  #map;
  #mapZoomLevel = 13;
  #mapEvents;
  #coords;
  #workout;
  #workouts = [];

  constructor() {
    this._getPosition();
    this._getLocalStorage();
    inputType.addEventListener("change", this._toggleElevationField);
    form.addEventListener("submit", this._newWorkout.bind(this));
    containerWorkouts.addEventListener("click", this._moveToPopup.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        (error) => alert(error.message)
      );
    } else {
      alert(
        "Your browser didn't support the geolocation feature. Please, use a new browser"
      );
    }
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    this.#map = L.map("map").setView([latitude, longitude], this.#mapZoomLevel);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on("click", this._showForm.bind(this));
    this.#workouts.forEach((workout) => {
      this._renderWorkoutMarker(workout);
    });
  }

  _showForm(e) {
    this.#mapEvents = e.latlng;
    this.#coords = [this.#mapEvents.lat, this.#mapEvents.lng];
    form.classList.remove("hidden");
    inputDistance.focus();
  }

  _hideForm() {
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        "";
    form.style.display = "none";
    form.classList.add("hidden");
    setTimeout(() => (form.style.display = "grid"), 1000);
  }

  _toggleElevationField() {
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
  }

  _newWorkout(e) {
    e.preventDefault();

    const validateInputs = (...inputs) =>
      inputs.every((input) => Number.isFinite(input));
    const validatePositive = (...inputs) => inputs.every((input) => input > 0);

    // Get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;

    // If workout is running, Create running object
    if (type === "running") {
      const candece = +inputCadence.value;
      if (
        !validateInputs(distance, duration, candece) ||
        !validatePositive(distance, duration, candece)
      )
        return alert("Inputs value must be positive numbers!");
      this.#workout = new Running(this.#coords, distance, duration, candece);
    }

    // If workout is cycling, create cycling object
    if (type === "cycling") {
      const elevation = +inputElevation.value;
      if (
        !validateInputs(distance, duration, elevation) ||
        !validatePositive(distance, duration)
      )
        return alert("Inputs have to be positive numbers!");
      this.#workout = new Cycling(this.#coords, distance, duration, elevation);
    }

    // Render workout on map as marker
    this._renderWorkoutMarker(this.#workout);

    // Render workout on list
    this._renderWorkout(this.#workout);

    // Add new workout to workouts array
    this._hideForm();

    // Add new object to workouts array
    this.#workouts.push(this.#workout);

    // Set workouts array in local storage
    this._setLocalStorage();
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          closeButton: false,
          autoClose: false,
          closeOnEscapeKey: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"}
         ${workout.type[0].toUpperCase()}${workout.type.slice(1)} on 
         ${workout.month} ${workout.day}
       `
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    const html = `
      <li class="workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class="workout__title">
        ${workout.type[0].toUpperCase()}${workout.type.slice(1)} on 
        ${workout.month} ${workout.day}

        </h2>
        <div class="workout__details">
          <span class="workout__icon">${
            workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"
          } </span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">   
           ${workout.type === "running" ? workout.pace : workout.speed}
          </span>
          <span class="workout__unit">${
            workout.type === "running" ? "min/km" : "km/h"
          }</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">
          ${workout.type === "running" ? "🦶🏼" : "⛰"}
        </span>
          <span class="workout__value">        
            ${
              workout.type === "running"
                ? workout.cadence
                : workout.elevationGain
            }
        </span>
          <span class="workout__unit">
          ${workout.type === "running" ? "spm" : "m"}
          </span>
        </div>
      </li>
  `;
    form.insertAdjacentHTML("afterend", html);
  }

  _moveToPopup(e) {
    const workoutEl = e.target.closest(".workout");

    if (workoutEl) {
      const id = +workoutEl.getAttribute("data-id");
      const workout = this.#workouts.find((workout) => workout.id === id);

      this.#map.setView(workout.coords, this.#mapZoomLevel, {
        pan: {
          duration: 1,
        },
      });
    }
  }

  _setLocalStorage() {
    localStorage.setItem("workouts", JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem("workouts"));

    if (!data) return;

    this.#workouts = data;
    data.forEach((workout) => {
      this._renderWorkout(workout);
    });
  }
}

const app = new App();
