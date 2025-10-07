const Book = require('../models/Book');
const fs = require('fs');
const sharp = require('sharp');

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

// exports.createBook = (req, res, next) => {
//   const bookObject = JSON.parse(req.body.book);
//   delete bookObject._id;
//   delete bookObject._userId;
//   delete req.body._id;
//   const filename = `resized-${req.file.filename}`;
//   sharp(req.file.path)
//     .resize({height: 800})
//     .toFile(`images/${filename}`)
//     .then(() => {
//       fs.unlink(req.file.path, (err) => {
//         if (err) console.error('Erreur suppression image originale:', err);
//       });
//       const book = new Book({
//         ...bookObject,
//         userId: req.auth.userId,
//         imageUrl: `${req.protocol}://${req.get('host')}/images/${filename}`,
//       });
//       return book.save();
//     })
//     .then(() => res.status(201).json({message: 'Livre enregistré'}))
//     .catch((error) => res.status(400).json({error}));
// };

exports.createBook = async (req, res) => {
  try {
    const bookObject = JSON.parse(req.body.book);
    delete bookObject._id;
    delete bookObject._userId;
    if (!req.file) {
      return res.status(400).json({error: 'Aucune image fournie'});
    }
    const originalPath = req.file.path;
    const filename = `resized-${req.file.filename}`;
    const resizedPath = `images/${filename}`;
    const fileBuffer = await fs.promises.readFile(originalPath);
    await sharp(fileBuffer).resize({height: 800}).toFile(resizedPath);
    await fs.promises.unlink(originalPath);
    const book = new Book({
      ...bookObject,
      userId: req.auth.userId,
      imageUrl: `${req.protocol}://${req.get('host')}/images/${filename}`,
    });
    await book.save();
    res.status(201).json({message: 'Livre enregistré', book});
  } catch (error) {
    console.error('Erreur createBook:', error);
    res.status(400).json({error});
  }
};

// exports.modifyBook = (req, res, next) => {
//   Book.findOne({_id: req.params.id}).then((book) => {
//     if (!book) {
//       return res.status(404).json({message: 'Livre non trouvé'});
//     }
//     if (book.userId.toString() !== req.auth.userId) {
//       return res.status(403).json({message: 'Non autorisé'});
//     }
//     let updatedBook;
//     if (req.file) {
//       const bookData = JSON.parse(req.body.book);
//       updatedBook = {...bookData, _id: req.params.id};
//       const oldFileName = book.imageUrl.split('/images/')[1];
//       fs.unlink(`images/${oldFileName}`, (err) => {
//         if (err) console.error(err);
//       });
//       const newFilename = `resized-${req.file.filename}`;
//       sharp(req.file.path)
//         .resize({height: 800})
//         .toFile(`images/${newFilename}`)
//         .then(() => {
//           fs.unlink(req.file.path, (err) => {
//             if (err) console.error('Erreur suppression image originale:', err);
//           });
//           updatedBook.imageUrl = `${req.protocol}://${req.get(
//             'host'
//           )}/images/${newFilename}`;

//           return Book.updateOne({_id: req.params.id}, updatedBook);
//         })
//         .then(() => res.status(200).json({message: 'Livre modifié'}))
//         .catch((error) => res.status(400).json({error}));
//     } else {
//       updatedBook = {...req.body, _id: req.params.id};
//       updatedBook.imageUrl = book.imageUrl;
//     }
//     Book.updateOne({_id: req.params.id}, updatedBook)
//       .then(() => res.status(200).json({message: 'Livre modifié'}))
//       .catch((error) => res.status(400).json({error}));
//   });
// };

exports.modifyBook = async (req, res) => {
  try {
    const book = await Book.findOne({_id: req.params.id});
    if (!book) return res.status(404).json({message: 'Livre non trouvé'});
    if (book.userId.toString() !== req.auth.userId)
      return res.status(403).json({message: 'Non autorisé'});
    let updatedBook;
    if (req.file) {
      const bookData = JSON.parse(req.body.book);
      const oldFileName = book.imageUrl.split('/images/')[1];
      const newFilename = `resized-${req.file.filename}`;
      const resizedPath = `images/${newFilename}`;
      const originalPath = req.file.path;
      const fileBuffer = await fs.promises.readFile(originalPath);
      await sharp(fileBuffer).resize({height: 800}).toFile(resizedPath);
      await fs.promises.unlink(originalPath).catch(() => {});
      await fs.promises.unlink(`images/${oldFileName}`).catch(() => {});
      updatedBook = {
        ...bookData,
        _id: req.params.id,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${newFilename}`,
      };
    } else {
      updatedBook = {...req.body, _id: req.params.id, imageUrl: book.imageUrl};
    }
    await Book.updateOne({_id: req.params.id}, updatedBook);
    res.status(200).json({message: 'Livre modifié'});
  } catch (error) {
    console.error('Erreur modifyBook:', error);
    res.status(400).json({error});
  }
};

exports.deleteBook = (req, res, next) => {
  Book.findOne({_id: req.params.id}).then((book) => {
    if (!book) {
      return res.status(404).json({message: 'Livre non trouvé'});
    }
    if (book.userId.toString() !== req.auth.userId) {
      return res.status(403).json({message: 'Non autorisé'});
    }
    const filename = book.imageUrl.split('/images/')[1];
    fs.unlink(`images/${filename}`, () => {
      Book.deleteOne({_id: req.params.id})
        .then(() => res.status(200).json({message: 'Livre supprimé'}))
        .catch((error) => res.status(400).json({error}));
    });
  });
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
