const activityLabels = activityData.map(item => item.log_date.split('T')[0]); // creates the dates for the activity charts (.split('T')[0]) keeps only the date part
const steps = activityData.map(item => item.steps); // creates an array o all step values from activity logs
const sleep = activityData.map(item => parseFloat(item.sleep_hours)); //creates an array of sleep hours parseFloat converts value into decimal eg "7.0" -> 7.0
const weight = activityData.map(item => parseFloat(item.weight_kg)); // creates an array of weight values parseFloat converts value into decimal eg "61.0" -> 61

// aggregate meals by date
const dailyMealTotals = {}; // creates an empty object
mealData.forEach(meal => {  // loops through every meal in mealData
  const date = meal.meal_date.split('T')[0]; // gets only the date part of the meal data

  if (!dailyMealTotals[date]) { // if it doesnt exist inside dailyMealTotals next line creates it
    dailyMealTotals[date] = { calories: 0, protein: 0 }; // creates starting total of 0 for that date
  }

  dailyMealTotals[date].calories += meal.calories; // adds the current meals calories to that date
  dailyMealTotals[date].protein += meal.protein; // adds the current meals protein to the daily total
});

const mealDates = Object.keys(dailyMealTotals); // gets all the dates from DailyMealTotals used as chart labels for calories
const totalCaloriesByDay = mealDates.map(date => dailyMealTotals[date].calories); // creates an array of total calories for each date
const totalProteinByDay = mealDates.map(date => dailyMealTotals[date].protein); // creates an array of total protein for each date

const avgSteps = steps.length ? (steps.reduce((a, b) => a + b, 0) / steps.length).toFixed(0) : 0; // calculates average steps
const avgSleep = sleep.length ? (sleep.reduce((a, b) => a + b, 0) / sleep.length).toFixed(1) : 0; // calculates average sleep
const avgCalories = totalCaloriesByDay.length ? (totalCaloriesByDay.reduce((a, b) => a + b, 0) / totalCaloriesByDay.length).toFixed(0) : 0; // calculates average daily calories
const avgProtein = totalProteinByDay.length ? (totalProteinByDay.reduce((a, b) => a + b, 0) / totalProteinByDay.length).toFixed(0) : 0; // calculates average daily protein

// Finds the HTML element with the ID's connects to the dashboard ejs
document.getElementById('avgSteps').textContent = avgSteps;
document.getElementById('avgSleep').textContent = avgSleep + ' hrs';
document.getElementById('avgCalories').textContent = avgCalories + ' kcal';
document.getElementById('avgProtein').textContent = avgProtein + ' g';

const calorieDifferenceElement = document.getElementById('calorieDifference'); // finds HTML where calories vs target is shown
const proteinDifferenceElement = document.getElementById('proteinDifference'); // finds HTML where protein vs target is shown
const stepsDifferenceElement = document.getElementById('stepsDifference'); // finds HTML where steps vs target is shown

if (userData && userData.target_calories) { // checks if user data exists and then if they have a target, if so compares avg calories to target
  const calorieDiff = avgCalories - userData.target_calories; // calculates the difference
  if (calorieDiff > 0) { // checks if user is above target
    calorieDifferenceElement.textContent = `+${calorieDiff} kcal above target`; 
  } else if (calorieDiff < 0) { // checks if the user is below target
    calorieDifferenceElement.textContent = `${calorieDiff} kcal below target`;
  } else { // if not above or below exactly on target
    calorieDifferenceElement.textContent = `On target`;
  }
} else { //this runs if theres no user profile or calorie goal
  calorieDifferenceElement.textContent = 'No profile yet';
}

if (userData && userData.target_protein) { // checks if user data exists and then if they have a target, if so compares avg protein to target
  const proteinDiff = avgProtein - userData.target_protein; // calculates the difference
  if (proteinDiff > 0) { // checks if user is above target
    proteinDifferenceElement.textContent = `+${proteinDiff} g above target`;
  } else if (proteinDiff < 0) { // checks if the user is below target
    proteinDifferenceElement.textContent = `${proteinDiff} g below target`;
  } else { // if not above or below exactly on target
    proteinDifferenceElement.textContent = `On target`;
  }
} else { //this runs if theres no user profile or protein goal
  proteinDifferenceElement.textContent = 'No profile yet';
}

if (userData && userData.step_goal) { // checks if user data exists and then if they have a target, if so compares avg steps to target
  const stepDiff = avgSteps - userData.step_goal; // calculates the difference
  if (stepDiff > 0) { // checks if user is above target
    stepsDifferenceElement.textContent = `+${stepDiff} above goal`;
  } else if (stepDiff < 0) { // checks if user is below target
    stepsDifferenceElement.textContent = `${stepDiff} below goal`;
  } else { // if not above or below exactly on target
    stepsDifferenceElement.textContent = `On target`;
  }
} else { //this runs if theres no user profile or step goal
  stepsDifferenceElement.textContent = 'No profile yet';
}

new Chart(document.getElementById('stepsChart'), {
  type: 'line', // type of chart
  data: {
    labels: activityLabels, // x-axis
    datasets: [{ // starts data series
      label: 'Steps', // Labels chart data as Steps
      data: steps // y-axis
    }]
  }
});

new Chart(document.getElementById('sleepChart'), {
  type: 'bar', // type of chart
  data: {
    labels: activityLabels, // x-axis 
    datasets: [{ // starts data series
      label: 'Sleep Hours', // labels chart data as Sleep hours
      data: sleep // y-axis
    }]
  }
});

new Chart(document.getElementById('caloriesChart'), {
  type: 'line', // type of chart
  data: {
    labels: mealDates, // x-axis
    datasets: [{ // starts data series
      label: 'Total Calories by Day', // labels chart data as Total Calories by Day
      data: totalCaloriesByDay // y-axis
    }]
  }
});

new Chart(document.getElementById('weightChart'), {
  type: 'line', // type of chart
  data: {
    labels: activityLabels, // x-axis
    datasets: [{ // starts data series
      label: 'Weight (kg)', // labels chart data as Weight (kg)
      data: weight // y-axis
    }]
  }
});