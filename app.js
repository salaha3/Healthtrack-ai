const express = require('express'); // Express is used to create the web server and routes
const mysql = require('mysql2'); // mysql2 is used to connect Node.js to the MySQL database
const path = require('path'); // path helps create safe file paths for views and public files

// creates Express app
const app = express();
const PORT = 3000;

// creates connection to MySQL database
const db = mysql.createConnection({
  host: 'localhost',
  port: 3307,
  user: 'root',
  password: 'rootpass',
  database: 'healthtrack_ai'
});

// Connects to the database and show message if successful
db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// Set up EJS as the template engine
app.set('view engine', 'ejs');
// tells Express where the EJS view files are stored
app.set('views', path.join(__dirname, 'views'));
// serve static files such as CSS and client-side JavaScript
app.use(express.static(path.join(__dirname, 'public')));
// allows Express to read form data submitted using POST requests
app.use(express.urlencoded({ extended: true }));

// Dashboard route
// Loads activity logs, meal logs and latest user profile
// then sends all data to dashboard.ejs
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

// shows the profile form page
app.get('/profile', (req, res) => {
  res.render('profile', { result: null });
});

// handles profile form submission
// calculates calorie, protein, carb, fat and step targets
// then saves profile into users table
app.post('/profile', (req, res) => {
    const { name, age, sex, height_cm, weight_kg, activity_level, goal, step_goal } = req.body;
  
    // convert form values from text to numbers
    const ageNum = parseInt(age, 10);
    const heightNum = parseInt(height_cm, 10);
    const weightNum = parseFloat(weight_kg);
    const stepGoalNum = parseInt(step_goal, 10);
 
    // calculates BMR using formula depending on sex
    let bmr;
    if (sex === 'male') {
      bmr = (10 * weightNum) + (6.25 * heightNum) - (5 * ageNum) + 5;
    } else {
      bmr = (10 * weightNum) + (6.25 * heightNum) - (5 * ageNum) - 161;
    }
  
    // activity muliplier used to estimate maintenance calories
    const activityMap = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725
    };
  
    // estimates maintenance calories
    const maintenanceCalories = bmr * activityMap[activity_level];
  
    // adjust calories depending on the users goal
    let targetCalories = maintenanceCalories;
    if (goal === 'lose') {
      targetCalories -= 500;
    } else if (goal === 'gain') {
      targetCalories += 300;
    }
  
    // calculates macro targets
    const protein = Math.round(weightNum * 2.0);
    const fats = Math.round(weightNum * 0.8);
    const proteinCalories = protein * 4;
    const fatCalories = fats * 9;
    const carbs = Math.round((targetCalories - proteinCalories - fatCalories) / 4);
  
    const roundedCalories = Math.round(targetCalories);
  
    // SQL query to insert calculated profile into database
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
  
    // save profile and show calcualtions
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

  // shows daily activity log page and previous activity logs
  app.get('/log', (req, res) => {
    db.query('SELECT * FROM daily_logs ORDER BY log_date DESC', (err, results) => {
      if (err) {
        console.error(err);
        return res.send('Error loading activity history.');
      }
  
      res.render('log', { logs: results });
    });
  });

// handles the daily activty form submission
// saves steps, sleep and weight into daily_logs table
app.post('/log', (req, res) => {
  const { log_date, steps, sleep_hours, weight_kg } = req.body;

  // gets latest user so the log can be linked to a users profile
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

// shows meal log page and previous meals
app.get('/meals', (req, res) => {
    db.query('SELECT * FROM meals ORDER BY meal_date DESC, id DESC', (err, results) => {
      if (err) {
        console.error(err);
        return res.send('Error loading meal history.');
      }
  
      res.render('meals', { meals: results });
    });
  });

// handles meal form submission
// saves calories, protein, carbs and fats into meals table
app.post('/meals', (req, res) => {
  const { meal_date, meal_type, meal_name, calories, protein, carbs, fats } = req.body;

  // gets latest user so the meal can be linked to a users profile
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

// recommended page route
// gets latest user, activity logs and meal logs
// sends the data to the recommended.ejs for calculations and recommendation messages
app.get('/recommended', (req, res) => {
  db.query('SELECT * FROM users ORDER BY id DESC LIMIT 1', (err, userResults) => {
    if (err) {
      console.error(err);
      return res.send('Error loading recommended page.');
    }

    const latestUser = userResults.length > 0 ? userResults[0] : null;

    db.query('SELECT * FROM daily_logs ORDER BY log_date ASC', (err, activityResults) => {
      if (err) {
        console.error(err);
        return res.send('Error loading activity data.');
      }

      db.query('SELECT * FROM meals ORDER BY meal_date ASC', (err, mealResults) => {
        if (err) {
          console.error(err);
          return res.send('Error loading meal data.');
        }

        // pass database data into recommended.ejs
        res.render('recommended', {
          user: latestUser,
          activityData: activityResults,
          mealData: mealResults
        });
      });
    });
  });
});

// starts the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});