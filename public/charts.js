const activityLabels = activityData.map(item => item.log_date.split('T')[0]);
const steps = activityData.map(item => item.steps);
const sleep = activityData.map(item => parseFloat(item.sleep_hours));
const weight = activityData.map(item => parseFloat(item.weight_kg));

// aggregate meals by date
const dailyMealTotals = {};
mealData.forEach(meal => {
  const date = meal.meal_date.split('T')[0];

  if (!dailyMealTotals[date]) {
    dailyMealTotals[date] = { calories: 0, protein: 0 };
  }

  dailyMealTotals[date].calories += meal.calories;
  dailyMealTotals[date].protein += meal.protein;
});

const mealDates = Object.keys(dailyMealTotals);
const totalCaloriesByDay = mealDates.map(date => dailyMealTotals[date].calories);
const totalProteinByDay = mealDates.map(date => dailyMealTotals[date].protein);

const avgSteps = steps.length ? (steps.reduce((a, b) => a + b, 0) / steps.length).toFixed(0) : 0;
const avgSleep = sleep.length ? (sleep.reduce((a, b) => a + b, 0) / sleep.length).toFixed(1) : 0;
const avgCalories = totalCaloriesByDay.length ? (totalCaloriesByDay.reduce((a, b) => a + b, 0) / totalCaloriesByDay.length).toFixed(0) : 0;
const avgProtein = totalProteinByDay.length ? (totalProteinByDay.reduce((a, b) => a + b, 0) / totalProteinByDay.length).toFixed(0) : 0;

document.getElementById('avgSteps').textContent = avgSteps;
document.getElementById('avgSleep').textContent = avgSleep + ' hrs';
document.getElementById('avgCalories').textContent = avgCalories + ' kcal';
document.getElementById('avgProtein').textContent = avgProtein + ' g';

const calorieDifferenceElement = document.getElementById('calorieDifference');
const proteinDifferenceElement = document.getElementById('proteinDifference');
const stepsDifferenceElement = document.getElementById('stepsDifference');

if (userData && userData.target_calories) {
  const calorieDiff = avgCalories - userData.target_calories;
  if (calorieDiff > 0) {
    calorieDifferenceElement.textContent = `+${calorieDiff} kcal above target`;
  } else if (calorieDiff < 0) {
    calorieDifferenceElement.textContent = `${calorieDiff} kcal below target`;
  } else {
    calorieDifferenceElement.textContent = `On target`;
  }
} else {
  calorieDifferenceElement.textContent = 'No profile yet';
}

if (userData && userData.target_protein) {
  const proteinDiff = avgProtein - userData.target_protein;
  if (proteinDiff > 0) {
    proteinDifferenceElement.textContent = `+${proteinDiff} g above target`;
  } else if (proteinDiff < 0) {
    proteinDifferenceElement.textContent = `${proteinDiff} g below target`;
  } else {
    proteinDifferenceElement.textContent = `On target`;
  }
} else {
  proteinDifferenceElement.textContent = 'No profile yet';
}

if (userData && userData.step_goal) {
  const stepDiff = avgSteps - userData.step_goal;
  if (stepDiff > 0) {
    stepsDifferenceElement.textContent = `+${stepDiff} above goal`;
  } else if (stepDiff < 0) {
    stepsDifferenceElement.textContent = `${stepDiff} below goal`;
  } else {
    stepsDifferenceElement.textContent = `On target`;
  }
} else {
  stepsDifferenceElement.textContent = 'No profile yet';
}

new Chart(document.getElementById('stepsChart'), {
  type: 'line',
  data: {
    labels: activityLabels,
    datasets: [{
      label: 'Steps',
      data: steps
    }]
  }
});

new Chart(document.getElementById('sleepChart'), {
  type: 'bar',
  data: {
    labels: activityLabels,
    datasets: [{
      label: 'Sleep Hours',
      data: sleep
    }]
  }
});

new Chart(document.getElementById('caloriesChart'), {
  type: 'line',
  data: {
    labels: mealDates,
    datasets: [{
      label: 'Total Calories by Day',
      data: totalCaloriesByDay
    }]
  }
});

new Chart(document.getElementById('weightChart'), {
  type: 'line',
  data: {
    labels: activityLabels,
    datasets: [{
      label: 'Weight (kg)',
      data: weight
    }]
  }
});