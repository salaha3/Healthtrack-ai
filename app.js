const express = require('express');
const mysql = require('mysql2');
const path = require('path');

const app = express();
const PORT = 3000;

const db = mysql.createConnection({
  host: 'localhost',
  port: 3307,
  user: 'root',
  password: 'rootpass',
  database: 'healthtrack_ai'
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  db.query('SELECT * FROM daily_logs ORDER BY log_date ASC', (err, activityResults) => {
    if (err) {
      console.error(err);
      return res.send('Database error loading activity data');
    }

    db.query('SELECT * FROM meals ORDER BY meal_date ASC', (err, mealResults) => {
      if (err) {
        console.error(err);
        return res.send('Database error loading meal data');
      }

      db.query('SELECT * FROM users ORDER BY id DESC LIMIT 1', (err, userResults) => {
        if (err) {
          console.error(err);
          return res.send('Database error loading user profile');
        }

        const latestUser = userResults.length > 0 ? userResults[0] : null;

        res.render('dashboard', {
          activityData: activityResults,
          mealData: mealResults,
          user: latestUser
        });
      });
    });
  });
});

app.get('/profile', (req, res) => {
  res.render('profile', { result: null });
});

app.post('/profile', (req, res) => {
    const { name, age, sex, height_cm, weight_kg, activity_level, goal, step_goal } = req.body;
  
    const ageNum = parseInt(age, 10);
    const heightNum = parseInt(height_cm, 10);
    const weightNum = parseFloat(weight_kg);
    const stepGoalNum = parseInt(step_goal, 10);
  
    let bmr;
    if (sex === 'male') {
      bmr = (10 * weightNum) + (6.25 * heightNum) - (5 * ageNum) + 5;
    } else {
      bmr = (10 * weightNum) + (6.25 * heightNum) - (5 * ageNum) - 161;
    }
  
    const activityMap = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725
    };
  
    const maintenanceCalories = bmr * activityMap[activity_level];
  
    let targetCalories = maintenanceCalories;
    if (goal === 'lose') {
      targetCalories -= 500;
    } else if (goal === 'gain') {
      targetCalories += 300;
    }
  
    const protein = Math.round(weightNum * 2.0);
    const fats = Math.round(weightNum * 0.8);
    const proteinCalories = protein * 4;
    const fatCalories = fats * 9;
    const carbs = Math.round((targetCalories - proteinCalories - fatCalories) / 4);
  
    const roundedCalories = Math.round(targetCalories);
  
    const sql = `
      INSERT INTO users
      (name, age, sex, height_cm, weight_kg, activity_level, goal, target_calories, target_protein, target_carbs, target_fats, step_goal)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
  
    const values = [
      name,
      ageNum,
      sex,
      heightNum,
      weightNum,
      activity_level,
      goal,
      roundedCalories,
      protein,
      carbs,
      fats,
      stepGoalNum
    ];
  
    db.query(sql, values, (err) => {
      if (err) {
        console.error(err);
        return res.send('Error saving profile.');
      }
  
      res.render('profile', {
        result: {
          name,
          targetCalories: roundedCalories,
          protein,
          carbs,
          fats,
          stepGoal: stepGoalNum
        }
      });
    });
  });

  app.get('/log', (req, res) => {
    db.query('SELECT * FROM daily_logs ORDER BY log_date DESC', (err, results) => {
      if (err) {
        console.error(err);
        return res.send('Error loading activity history.');
      }
  
      res.render('log', { logs: results });
    });
  });

app.post('/log', (req, res) => {
  const { log_date, steps, sleep_hours, weight_kg } = req.body;

  db.query('SELECT id FROM users ORDER BY id DESC LIMIT 1', (err, userResults) => {
    if (err || userResults.length === 0) {
      return res.send('No user profile found. Please create a profile first.');
    }

    const user_id = userResults[0].id;

    const sql = `
      INSERT INTO daily_logs (user_id, log_date, steps, sleep_hours, weight_kg)
      VALUES (?, ?, ?, ?, ?)
    `;

    db.query(sql, [user_id, log_date, steps, sleep_hours, weight_kg], (err) => {
      if (err) {
        console.error(err);
        return res.send('Error saving activity log.');
      }

      res.redirect('/');
    });
  });
});

app.get('/meals', (req, res) => {
    db.query('SELECT * FROM meals ORDER BY meal_date DESC, id DESC', (err, results) => {
      if (err) {
        console.error(err);
        return res.send('Error loading meal history.');
      }
  
      res.render('meals', { meals: results });
    });
  });

app.post('/meals', (req, res) => {
  const { meal_date, meal_type, meal_name, calories, protein, carbs, fats } = req.body;

  db.query('SELECT id FROM users ORDER BY id DESC LIMIT 1', (err, userResults) => {
    if (err || userResults.length === 0) {
      return res.send('No user profile found. Please create a profile first.');
    }

    const user_id = userResults[0].id;

    const sql = `
      INSERT INTO meals (user_id, meal_date, meal_type, meal_name, calories, protein, carbs, fats)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [user_id, meal_date, meal_type, meal_name, calories, protein, carbs, fats], (err) => {
      if (err) {
        console.error(err);
        return res.send('Error saving meal.');
      }

      res.redirect('/');
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});