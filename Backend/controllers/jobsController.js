const Job = require('../models/Job');
const Application = require('../models/Application');
const notificationHelper = require('../utils/notificationHelper');

const createJob = async (req, res) => {
  try {
    if (req.user.role !== 'recruiter' && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Only recruiters can post jobs' });

    const { title, company, location, type, salary, description } = req.body;
    if (!title || !company) return res.status(400).json({ error: 'Title and company required' });

    const jobData = { 
      title, 
      company, 
      location, 
      type, 
      salary, 
      description, 
      posted_by: req.user.id,
      status: 'active'
    };
    
    const job = await Job.create(jobData);

    // ============================================
    // SEND NOTIFICATIONS
    // ============================================
    try {
      // Notify all students
      await notificationHelper.sendToStudents(
        'New Job Posted 💼',
        `A new job "${title}" has been posted at ${company}`,
        'job_alert',
        '/Student/job-list.html'
      );

      // Notify all admins
      await notificationHelper.sendToAdmins(
        'New Job Posted',
        `A new job "${title}" was posted by ${company}`,
        'job_alert',
        '/Admin/jobs.html'
      );

      // Notify the recruiter
      await notificationHelper.sendToRecruiter(
        req.user.id,
        'Job Posted Successfully ✅',
        `Your job "${title}" has been posted successfully!`,
        'job_posted',
        '/Recruiter/my-jobs.html'
      );

      console.log(`✅ Notifications sent for job: ${title}`);
    } catch (notifError) {
      console.error('⚠️ Notification error:', notifError.message);
    }

    res.json({ 
      success: true, 
      job: job,
      message: 'Job created successfully!'
    });
  } catch (err) {
    console.error('Error creating job:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

const listJobs = async (req, res) => {
  try {
    const { q, page = 1, limit = 10, type, location, minSalary, maxSalary, skills } = req.query;
    const { jobs, total } = await Job.searchJobs({
      query: q,
      page: Number(page),
      limit: Number(limit),
      filters: { type, location, minSalary, maxSalary, skills }
    });
    res.json({ jobs, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('List jobs error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getJob = async (req, res) => {
  try {
    const job = await Job.getJobById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
  } catch (err) {
    console.error('Get job error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const updateJob = async (req, res) => {
  try {
    const id = req.params.id;
    const { title, company, location, type, salary, description, status } = req.body;
    
    // Get existing job for notification
    const existingJob = await Job.findByPk(id);
    if (!existingJob) return res.status(404).json({ error: 'Job not found' });

    const fields = { title, company, location, type, salary, description };
    if (status) fields.status = status;
    
    const updatedJob = await Job.updateJob(id, fields);

    // ============================================
    // SEND NOTIFICATIONS ON UPDATE
    // ============================================
    try {
      await notificationHelper.sendToRecruiter(
        req.user.id,
        'Job Updated ✏️',
        `Your job "${title || existingJob.title}" has been updated.`,
        'system',
        '/Recruiter/my-jobs.html'
      );

      // If job was reopened, notify students
      if (status === 'active' && existingJob.status !== 'active') {
        await notificationHelper.sendToStudents(
          'Job Reopened 🔄',
          `The job "${existingJob.title}" at ${existingJob.company} has been reopened!`,
          'job_alert',
          '/Student/job-list.html'
        );
      }
    } catch (notifError) {
      console.error('⚠️ Notification error:', notifError.message);
    }

    res.json({ 
      success: true,
      message: 'Job updated successfully'
    });
  } catch (err) {
    console.error('Update job error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteJob = async (req, res) => {
  try {
    const id = req.params.id;
    
    // Get job data before deletion
    const job = await Job.findByPk(id);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    // ============================================
    // ✅ DELETE APPLICATIONS FIRST (Cascade Delete)
    // ============================================
    
    // Delete all applications related to this job
    await Application.destroy({
      where: { job_id: id }
    });
    console.log(`✅ Deleted applications for job ${id}`);

    // Then delete the job
    await Job.deleteJob(id);
    console.log(`✅ Deleted job ${id}`);

    // ============================================
    // SEND NOTIFICATION
    // ============================================
    try {
      await notificationHelper.sendToRecruiter(
        req.user.id,
        'Job Deleted 🗑️',
        `Your job "${job.title}" has been deleted.`,
        'system',
        '/Recruiter/my-jobs.html'
      );
    } catch (notifError) {
      console.error('⚠️ Notification error:', notifError.message);
    }

    res.json({ 
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (err) {
    console.error('Delete job error:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
};

module.exports = { 
  createJob, 
  listJobs, 
  getJob, 
  updateJob, 
  deleteJob 
};