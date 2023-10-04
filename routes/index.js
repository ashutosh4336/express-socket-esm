import express from 'express';
import {
  getNotification,
  sendNotification,
} from '../controllers/notification.js';

const router = express.Router();

router.route('/').get(getNotification).post(sendNotification);

export default router;
