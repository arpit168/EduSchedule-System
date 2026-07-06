import ClassModel from '../models/classModel.js';

const getClasses = async (req, res, next) => {
  try {
    const { department, semester, search, page = 1, limit = 50 } = req.query;
    const query = {};

    if (department && department !== 'all') query.department = department;
    if (semester && semester !== 'all') query.semester = Number(semester);
    if (search) {
      query.$or = [
        { className: { $regex: search, $options: 'i' } },
        { section: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await ClassModel.countDocuments(query);
    const classes = await ClassModel.find(query).populate('department', 'name code').sort({ className: 1, section: 1 }).skip(skip).limit(limitNum);
    res.status(200).json({
      success: true,
      count: classes.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: classes,
    });
  } catch (error) {
    next(error);
  }
};

const getClassById = async (req, res, next) => {
  try {
    const cls = await ClassModel.findById(req.params.id).populate('department', 'name code');
    if (!cls) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }
    res.status(200).json({ success: true, data: cls });
  } catch (error) {
    next(error);
  }
};

const createClass = async (req, res, next) => {
  try {
    const cls = await ClassModel.create(req.body);
    const populated = await ClassModel.findById(cls._id).populate('department', 'name code');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

const updateClass = async (req, res, next) => {
  try {
    const cls = await ClassModel.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: 'after',
      runValidators: true,
    }).populate('department', 'name code');

    if (!cls) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }
    res.status(200).json({ success: true, data: cls });
  } catch (error) {
    next(error);
  }
};

const deleteClass = async (req, res, next) => {
  try {
    const cls = await ClassModel.findById(req.params.id);
    if (!cls) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }
    await cls.deleteOne();
    res.status(200).json({ success: true, message: 'Class removed successfully' });
  } catch (error) {
    next(error);
  }
};

export { getClasses, getClassById, createClass, updateClass, deleteClass };
