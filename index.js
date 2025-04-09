const express = require('express');
const cors = require('cors');
const { 
  getAllTasks,
  getTaskDetails,
  completeTask,
  updateTask,
  deleteTask,
  createSchedule,
  updateSchedule,
  getUserIdByEmailAndName,
  createUser
} = require('./tasksAPI');

const app = express();
app.use(cors());
app.use(express.json());



// Add this endpoint to your existing routes
app.post('/api/createUser', async (req, res) => {
  try {
    const { name, email, phone_number } = req.body;
    
    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ 
        error: 'Name and email are required fields' 
      });
    }

    // Create the user
    const result = await createUser({
      name,
      email,
      phone_number
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: result.data
    });

  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
});

// API endpoints
app.get('/api/tasks/:userid', async (req, res) => {
  try {
    const tasks = await getAllTasks(req.params.userid);
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ 
      error: 'Failed to fetch tasks',
      details: error.message
    });
  }
});

// Add this endpoint to your existing routes
app.post('/api/user/id', async (req, res) => {
  try {
    const { email, name } = req.body;
    
    // Validate input
    if (!email || !name) {
      return res.status(400).json({ 
        error: 'Both email and name are required',
        code: 'MISSING_FIELDS'
      });
    }

    const userId = await getUserIdByEmailAndName(email, name);
    
    if (!userId) {
      return res.status(404).json({ 
        error: 'User not found in database',
        code: 'USER_NOT_FOUND',
        shouldRedirect: true
      });
    }

    return res.json({ userId });

  } catch (error) {
    console.error('Endpoint error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});




app.get('/api/task/:id', async (req, res) => {
  try {
    const task = await getTaskDetails(req.params.id);
    
    if (!task) {
      return res.status(404).json({ 
        error: 'Task not found',
        details: `No task found with ID ${req.params.id}`
      });
    }
    
    res.json(task);
  } catch (error) {
    console.error('Error fetching task details:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
});

app.patch('/api/tasks/:id/complete', async (req, res) => {
  try {
    const result = await completeTask(req.params.id);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error('Error completing task:', error);
    res.status(500).json({ 
      error: 'Failed to complete task',
      details: error.message
    });
  }
});

app.put('/api/tasks/:id', async (req, res) => {
  try {
    const result = await updateTask(req.params.id, req.body);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ 
      error: 'Failed to update task',
      details: error.message
    });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const result = await deleteTask(req.params.id);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ 
      error: 'Failed to delete task',
      details: error.message
    });
  }
});

// Schedule endpoints
app.post('/api/schedules', async (req, res) => {
  try {
    const result = await createSchedule(req.body);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).json({ 
      error: 'Failed to create schedule',
      details: error.message
    });
  }
});

app.put('/api/schedules/:id', async (req, res) => {
  try {
    const result = await updateSchedule(req.params.id, req.body);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).json({ 
      error: 'Failed to update schedule',
      details: error.message
    });
  }
});

const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
module.exports(app)