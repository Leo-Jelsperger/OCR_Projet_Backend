const Book = require('../models/Book');

exports.getAllBooks = (req, res, next) => {
  Book.find()
    .then((books) => res.status(200).json(books))
    .catch((error) => res.status(400).json({error}));
};

exports.getOneBook = (req, res, next) => {
  Book.findOne({_id: req.params.id})
    .then((book) => res.status(200).json(book))
    .catch((error) => res.status(404).json({error}));
};

exports.getBestRating = (req, res, next) => {
  Book.find()
    .sort({averageRating: -1})
    .limit(3)
    .then((books) => res.status(200).json(books))
    .catch((error) => res.status(400).json({error}));
};

exports.createBook = (req, res, next) => {
  const bookObject = JSON.parse(req.body.book);
  delete bookObject._id;
  delete bookObject._userId;
  delete req.body._id;
  const book = new Book({
    ...bookObject,
    userId: req.auth.userId,
    imageUrl: `${req.protocol}://${req.get('host')}/images/${
      req.file.filename
    }`,
  });
  book
    .save()
    .then(() => res.status(201).json({message: 'Livre enregistré'}))
    .catch((error) => res.status(400).json({error}));
};

exports.modifyBook = (req, res, next) => {
  Book.updateOne({_id: req.params.id}, {...req.body, _id: req.params.id})
    .then(() => res.status(200).json({message: 'Livre modifié'}))
    .catch((error) => res.status(400).json({error}));
};

exports.deleteBook = (req, res, next) => {
  Book.deleteOne({_id: req.params.id})
    .then(() => res.status(200).json({message: 'Livre supprimé'}))
    .catch((error) => res.status(400).json({error}));
};

exports.addRating = (req, res, next) => {
  const userId = req.auth.userId;
  const grade = req.body.rating;
  Book.findOne({_id: req.params.id})
    .then((book) => {
      if (!book) {
        return res.status(404).json({error: 'Livre non trouvé'});
      }
      const alreadyRated = book.ratings.find((r) => r.userId === userId);
      if (alreadyRated) {
        return res
          .status(400)
          .json({error: 'Note déjà ajoutée pour cet utilisateur'});
      }
      book.ratings.push({userId, grade});
      const total = book.ratings.reduce((acc, r) => acc + r.grade, 0);
      const average = total / book.ratings.length;
      book.averageRating = Math.round(average * 10) / 10;
      book
        .save()
        .then((updatedBook) => res.status(200).json(updatedBook))
        .catch((error) => res.status(400).json({error}));
    })
    .catch((error) => res.status(500).json({error}));
};
