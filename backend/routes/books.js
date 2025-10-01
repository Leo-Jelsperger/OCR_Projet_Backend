const express = require('express');
const booksCtrl = require('../controllers/books');
const auth = require('../middleware/auth');
const multer = require('../middleware/multer-config');

const router = express.Router();

router.get('/', booksCtrl.getAllBooks);
router.get('/bestrating', booksCtrl.getBestRating);
router.post('/', auth, multer, booksCtrl.createBook);
router.get('/:id', booksCtrl.getOneBook);
router.put('/:id', auth, multer, booksCtrl.modifyBook);
router.delete('/:id', auth, booksCtrl.deleteBook);
router.post('/:id/rating', auth, booksCtrl.addRating);

module.exports = router;


exports.addRating = (req, res, next) => {
  const userId = req.auth.userId;
  const grade = req.body.rating;
  Book.findOne({_id: req.params.id})
    .then((book) => {
      const alreadyRated = book.ratings.find((r) => r.userId === userId);
      if (alreadyRated) {
        return res
          .status(400)
          .json({message: 'Note déjà ajoutée pour cet utilisateur'});
      }
      book.ratings.push({userId, grade});
      const total = book.ratings.reduce((acc, r) => acc + r.grade, 0);
      const average = total / book.ratings.length;
      book.averageRating = Math.round(average * 10) / 10;
      book
        .save()
        .then(() => res.status(200).json({message: 'Livre noté'}))
        .catch((error) => res.status(400).json({error}));
    })
    .catch((error) => res.status(500).json({error}));
};