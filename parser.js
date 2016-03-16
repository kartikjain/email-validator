var xlsx = require('node-xlsx');
var mysql = require('mysql');


DATABASE_HOST = 'localhost';
DATABASE_NAME = 'website';
DATABASE_USERNAME = 'root';
DATABASE_PASSWORD = 'cheese';

var connectionNode = mysql.createConnection({
    host: DATABASE_HOST,
    user: DATABASE_USERNAME,
    password: DATABASE_PASSWORD,
    database: DATABASE_NAME
});

var connectionNode2 = mysql.createConnection({
    host: DATABASE_HOST,
    user: DATABASE_USERNAME,
    password: DATABASE_PASSWORD,
    database: DATABASE_NAME
});

var obj = xlsx.parse(__dirname + '/excel.xlsx'); // parses a file
console.log(obj[0].data.length)
var invalidEmailsFile = xlsx.parse(__dirname + '/invalid.xlsx');
var invalidEmailsList = []
   
for(var i=0; i<invalidEmailsFile[0].data.length; i++){       
   var invalidEmail = invalidEmailsFile[0].data[i].toString().toLowerCase().replace(/ /g,'')           
   invalidEmailsList.push(invalidEmail)        
}

connectionNode.connect();
var index = 0;

function doQueryAddEmail(email) {
    if(!email){
        console.log('empty email')
        console.log(email)
        return
    }
    var validEmail = validateEmail(email);
    if(!validEmail){
        console.log('invalid email')
        console.log(email)        
        return
    }
    (function(email) {
        connectionNode.query('select email from mail_mail where email = ?',
            [email], function (err, rows, fields) {
                console.log('external query'+rows)
            if (err) {
                console.log(err);
                return
            } else {                
                if(rows.length==0){                                        
                    (function(email) {
                        var query = 'INSERT INTO website.mail_mail (email) VALUES(\''+email+'\')'.toString()
                        connectionNode.query(query, function (err, rows) {
                            console.log('internal query'+rows)
                            if (err) {
                                console.log(err);
                                return
                            } else {
                                index++;
                                addEmails()
                            }
                        });
                    })(email);                    
                }else{
                    console.log('repeated email'+rows[0].email)
                    index++;
                    addEmails()
                }                
            }
        });
    })(email);
    
}


function addEmails() {
    console.log(index)     
    if(index < obj[0].data.length){
        var email = obj[0].data[index].toString().toLowerCase().replace(/ /g,'')
        if(email != '' && invalidEmailsList.indexOf(email) == -1){            
            doQueryAddEmail(email)
        }else{
            console.log('oops')
            console.log(email)
            console.log(invalidEmailsList.indexOf(email))
            index++;
            addEmails()
        }
    }        
}

function validateEmail(email) {
    var re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

addEmails()


