const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = "https://adsnebivksfdycwmejeh.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkc25lYml2a3NmZHljd21lamVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMzMjQwNjEsImV4cCI6MjA1ODkwMDA2MX0.h7iJPsHKx8DB4M8fig9EVwiUG8X4eQpHuzhLbxv5mgU";
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to assign colors to days
function getDayColor(day) {
    const colors = {
        'Monday': '#FF6B6B',
        'Tuesday': '#4ECDC4',
        'Wednesday': '#FFD166',
        'Thursday': '#A05195',
        'Friday': '#F47E60',
        'Saturday': '#06D6A0',
        'Sunday': '#118AB2',
        'Unscheduled': '#888'
    };
    return colors[day] || '#888';
}



async function getUserIdByEmailAndName(email, name) {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .eq('name', name)
            .maybeSingle();

        if (error) throw error;
        return data?.id || null;

    } catch (error) {
        console.error('Error in getUserIdByEmailAndName:', error.message);
        return null;
    }
}



/**
 * Get all tasks with only basic information and day colors
 */
async function getAllTasks(userId) {
    try {
        // Ensure supabase client is initialized
        if (!supabase) {
            throw new Error('Supabase client not initialized');
        }

        // Ensure userId is provided
        if (!userId) {
            throw new Error('User ID is required');
        }

        const { data, error } = await supabase
            .from('tasks')
            .select(`
                id,
                title,
                task_day,
                priority,
                user_id
            `)  // Removed inline comment from the select string
            .eq('user_id', userId)  // Filter by user ID
            .order('priority', { ascending: true })
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }

        // Handle case where data is null
        if (!data) {
            console.warn('No tasks found for user:', userId);
            return [];
        }

        const tasksByDay = data.reduce((acc, task) => {
            const day = task.task_day || 'Unscheduled';
            if (!acc[day]) {
                acc[day] = {
                    dayName: day,
                    color: getDayColor(day),
                    tasks: []
                };
            }

            acc[day].tasks.push({
                id: task.id,
                title: task.title
            });

            return acc;
        }, {});

        const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Unscheduled'];
        return Object.values(tasksByDay).sort((a, b) => {
            return daysOrder.indexOf(a.dayName) - daysOrder.indexOf(b.dayName);
        });

    } catch (error) {
        console.error('Error in getAllTasks:', {
            message: error.message,
            stack: error.stack,
            name: error.name,
            userId: userId
        });
        return [];
    }
}
/**
 * Get single task details with schedules
 */
async function getTaskDetails(taskId) {
    try {
        // First get the task details
        const { data: taskData, error: taskError } = await supabase
            .from('tasks')
            .select('*')
            .eq('id', taskId)
            .single();

        if (taskError) {
            console.error('Task Error:', taskError);
            throw new Error('Failed to fetch task details');
        }

        // If no task found, return null
        if (!taskData) {
            return null;
        }

        // Then get the schedules separately
        const { data: scheduleData, error: scheduleError } = await supabase
            .from('schedule')
            .select('*')
            .eq('task_id', taskId);

        if (scheduleError) {
            console.error('Schedule Error:', scheduleError);
            // Return task even if schedules fail
            return {
                ...taskData,
                schedules: []
            };
        }

        return {
            ...taskData,
            schedules: scheduleData || [] // Ensure schedules is always an array
        };

    } catch (error) {
        console.error('Error in getTaskDetails:', error.message);
        throw error;
    }
}

/**
 * Mark task as completed
 */
async function completeTask(taskId) {
    try {
        const { error } = await supabase
            .from('schedule')
            .update({ status: 'completed' })
            .eq('task_id', taskId);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error completing task:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Update task
 */
async function updateTask(taskId, taskData) {
    try {
        const { error } = await supabase
            .from('tasks')
            .update(taskData)
            .eq('id', taskId);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error updating task:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Delete task
 */
async function deleteTask(taskId) {
    try {
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', taskId);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error deleting task:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Create new schedule
 */
async function createSchedule(scheduleData) {
    try {
        const { data, error } = await supabase
            .from('schedule')
            .insert(scheduleData)
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error creating schedule:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Update schedule
 */
async function updateSchedule(scheduleId, scheduleData) {
    try {
        const { data, error } = await supabase
            .from('schedule')
            .update(scheduleData)
            .eq('id', scheduleId)
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error updating schedule:', error.message);
        return { success: false, error: error.message };
    }
}


async function createUser(userData) {
    try {
        // Validate required fields
        if (!userData.name || !userData.email) {
            throw new Error('Name and email are required');
        }

        // Insert the new user
        const { data, error } = await supabase
            .from('users')
            .insert([
                {
                    name: userData.name,
                    email: userData.email,
                    phone_number: userData.phone_number || null
                }
            ])
            .select()
            .single();

        if (error) throw error;

        return {
            success: true,
            data: data
        };

    } catch (error) {
        console.error('Error creating user:', error.message);

        // Handle specific Supabase errors
        if (error.code === '23505') { // Unique violation
            return {
                success: false,
                error: 'Email already exists',
                details: error.message
            };
        }

        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = {
    getAllTasks,
    getTaskDetails,
    completeTask,
    updateTask,
    deleteTask,
    createSchedule,
    updateSchedule,
    getUserIdByEmailAndName,
    createUser
};