import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

export const getNotification = asyncHandler(async (req, res, next) => {
  // if (Math.random() > 0.5) {
  //   throw new ApiError(400, 'Something went wrong while sending notification');
  // }

  res.status(200).json({
    success: true,
    message: 'Notification sent successfully',
    data: [
      {
        title: 'Notification Title',
        body: 'Notification Body',
        icon: 'Notification Icon',
        image: 'Notification Image',
        data: {
          link: 'Notification Link',
        },
      },
    ],
  });
});

export const sendNotification = async (req, res, next) => {
  try {
    res.status(201).json({
      success: true,
      message: 'Notification create successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      data: null,
    });
  }
};
