 const express = require('express');
 const userController = require('../controllers/userController');
 const authenticateToken = require('../middleware/authentication');
 const router = express.Router();
 const { upload, compressAndSaveImage } = require('../middleware/multer');

 router.post('/upsertOnlyUserProfileImg', upload.fields([
   { name: 'profilePicUrl', maxCount: 1 },
   { name: 'aadharCardFronturl', maxCount: 1 },
   { name: 'aadharCardBackurl', maxCount: 1 },
  ]), compressAndSaveImage, userController.upsertOnlyUserProfileImg);

router.post('/loginUser', userController.loginUser);
router.post('/logout', userController.logout);
router.post('/signUp', userController.signUp);

router.post('/', userController.createUser);
router.get('/:id', userController.getUserById);
router.get('/', userController.getAllUsers);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);
router.get('/search/:searchTerm', userController.searchUser);

module.exports = router;
