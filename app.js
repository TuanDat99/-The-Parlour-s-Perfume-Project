var express = require('express');
var path = require('path');
var mongoose = require('mongoose');
var config = require('./config/database');
var bodyParser = require('body-parser');
var session = require('express-session');
var expressValidator = require('express-validator');
var fileUpload = require('express-fileupload');
var passport = require('passport');


//connect DB
mongoose.connect(config.database);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('Mongodb connected');
});
//Init app
var app = express();

//view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//set public forder
app.use(express.static(path.join(__dirname, 'public')));


//set global error
app.locals.errors = null;

// Get Page Model
var Page = require('./models/page');

// Get all pages to pass to header.ejs
Page.find({}).sort({sorting: 1}).exec(function (err, pages) {
    if (err) {
        console.log(err);
    } else {
        app.locals.pages = pages;
    }
});



// Get Category Model
var Category = require('./models/category');

// Get all categories to pass to header.ejs
Category.find(function (err, categories) {
    if (err) {
        console.log(err);
    } else {
        app.locals.categories = categories;
    }
});


// Express fileUpload middleware
app.use(fileUpload());

//Body parse middel
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

// Express Session middleware
app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true
//  cookie: { secure: true }
}));

//Express validator
// Express Validator middleware
app.use(expressValidator({
  errorFormatter: function (param, msg, value) {
      var namespace = param.split('.')
              , root = namespace.shift()
              , formParam = root;

      while (namespace.length) {
          formParam += '[' + namespace.shift() + ']';
      }
      return {
          param: formParam,
          msg: msg,
          value: value
      };
  },
  customValidators: {
      isImage: function (value, filename) {
          var extension = (path.extname(filename)).toLowerCase();
          switch (extension) {
              case '.jpg':
                  return '.jpg';
              case '.jpeg':
                  return '.jpeg';
              case '.png':
                  return '.png';
              case '':
                  return '.jpg';
              default:
                  return false;
          }
      }
  }
}));


//messager
app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});


// Passport Config
require('./config/passport')(passport);
// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());


app.get('*', function(req,res,next) {
    res.locals.cart = req.session.cart;
    res.locals.user = req.user || null;
    next();
 });
 
//set routes
var adminPages = require('./routes/admin_pages.js');
var adminCategories = require('./routes/admin_categories.js');
var adminProducts = require('./routes/admin_products.js');
var cart = require('./routes/cart.js');
var products = require('./routes/products.js');
var pages = require('./routes/pages.js');
var users = require('./routes/users.js');
app.use('/users', users);
app.use('/cart', cart);
app.use('/products', products);
app.use('/admin/pages', adminPages);
app.use('/admin/categories', adminCategories);
app.use('/admin/products', adminProducts);
app.use('/', pages);

//start the server
var port = 8080;
app.listen(port, function() {
    console.log('Server started on port ' + port);
});