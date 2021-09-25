// When back arrow is clicked, show previous section
window.onpopstate = function(event) {
  console.log(typeof event.state.section);
  if(typeof event.state.section === 'string'){
    if(event.state.section!='compose') {
      load_mailbox(event.state.section);
    }
    else if(event.state.section==='compose') {
      compose_email();
    }
  }
  else {
    load_clickedMail(event.state.section);
  }
}

document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => {
    load_mailbox('inbox');
    history.pushState({section: 'inbox'}, "", "");
  });
  document.querySelector('#sent').addEventListener('click', () => {
    load_mailbox('sent');
    history.pushState({section: 'sent'}, "", "");
  });
  document.querySelector('#archived').addEventListener('click', () => {
    load_mailbox('archive');
    history.pushState({section: 'archive'}, "", "");
  });
  document.querySelector('#compose').addEventListener('click', () => {
    compose_email();
    history.pushState({section: 'compose'}, "", "");
  });

  // By default, load the inbox
  load_mailbox('inbox');
  history.pushState({section: 'inbox'}, "", "");

  // Submit the form if recipient is valid and show success message, otherwise load an empty form and show error message
  document.querySelector('#compose-form').onsubmit = function() {
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: `${document.querySelector('#compose-recipients').value}`,
        subject: `${document.querySelector('#compose-subject').value}`,
        body: `${document.querySelector('#compose-body').value}`
      })
    })
    .then(response => response.json())
    .then(result => {
      console.log(result);
      if(result.error) {
        compose_email();
        alert(`${result.error}`);
      }
      else {
        load_mailbox('sent');
        alert(`${result.message}`);
      }
    });
    return false;
  }
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#mails-list').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#clickedMail-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#mails-list').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#clickedMail-view').style.display = 'none';

  // Clear previous mail items
  document.querySelectorAll('.mail-read').forEach(mail => mail.remove());
  document.querySelectorAll('.mail-unread').forEach(mail => mail.remove());

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Load the appropriate mailbox
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    console.log(emails);
    emails.forEach(add_email);
  });
}

// Add a new mail with given contents to DOM
function add_email(mail) {
  // Create new mail
  const item = document.createElement('div');
  
  // Mark read and unread mails with different classes
  if(mail.read===false) {
    item.className = 'mail-unread';
  }
  else {
    item.className = 'mail-read';
  }

  item.innerHTML = 
  `<div class="mail-content">
  <div class="mail-sender">${mail.sender}</div>
  <div class="mail-time">${mail.timestamp}</div>
  </div>
  <div class="mail-subNbody"><b>${mail.subject}</b> - ${mail.body}</div>`;
  item.addEventListener('click', function(){
    console.log('This element has been clicked!');
    load_clickedMail(mail.id);
    history.pushState({section: mail.id}, "", "");
    fetch(`/emails/${mail.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        read: true
      })
    });
  });

  // Add mail to DOM
  document.querySelector('#mails-list').append(item);
}

function load_clickedMail(id) {
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(mail => {
    console.log(mail);
    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#mails-list').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#clickedMail-view').style.display = 'block';
    
    // Clear previous sender and recipient items
    if(document.querySelector('.clickedMail-content')){
      document.querySelector('.clickedMail-content').remove();
    }
  
    // Content of clicked email
    const item = document.createElement('div');
    item.className = 'clickedMail-content';
    item.innerHTML = 
    `<div id="clickedMail-topWrapper">
    <h3 id="clickedMail-subject">${mail.subject}</h3>
    <div id="reply"></div>
    <div id="archive"></div>
    </div>
    <br>
    <div id="clickedMail-time">${mail.timestamp}</div>
    <hr>
    <div id="clickedMail-container">
    <div class="clickedMail-title"><b>Sender:</b></div>
    <div id="clickedMail-sender"><i>${mail.sender}</i></div>
    <div class="clickedMail-title"><b>Recipients:</b></div>
    <div id="clickedMail-recipients"><i></i></div>
    </div>
    <br>
    <div id="clickedMail-body">${mail.body}</div>`
    document.querySelector('#clickedMail-view').append(item);
  
    // Loop for each recipients
    var counter = 1;
    mail.recipients.forEach(recipient => {
      const rcp = document.createElement('span');
      if(counter==mail.recipients.length) {
        rcp.innerHTML = `<i>${recipient}</i>`;
      }
      else {
        rcp.innerHTML = `<i>${recipient}, </i>`;
      }
      document.querySelector('#clickedMail-recipients').append(rcp);
      counter+=1;
    });
  
    // Shows reply or archive button when necessary
    // Exclude the sent page
    if(mail.sender!=document.querySelector('#user').outerText){
      // Shows reply button
      const reply = document.createElement('button');
      reply.className = 'btn btn-outline-primary';
      reply.innerHTML = 'Reply';
      reply.addEventListener('click', function() {
        // Show compose view and hide other views
        document.querySelector('#emails-view').style.display = 'none';
        document.querySelector('#mails-list').style.display = 'none';
        document.querySelector('#compose-view').style.display = 'block';
        document.querySelector('#clickedMail-view').style.display = 'none';
  
        // Clear out composition fields
        document.querySelector('#compose-recipients').value = `${mail.sender}`;
        document.querySelector('#compose-recipients').disabled = true;
        if(mail.subject.slice(0,3)==='Re:') {
          document.querySelector('#compose-subject').value = `${mail.subject}`;
        }
        else {
          document.querySelector('#compose-subject').value = `Re: ${mail.subject}`;
        }
        document.querySelector('#compose-body').value = `On ${mail.timestamp} ${mail.sender} wrote: ${mail.body}`;
      });
      document.querySelector('#reply').append(reply);
  
      // Shows archive button on inbox page
      const btn = document.createElement('button');
      if(mail.archived===false){
        btn.className = 'btn btn-outline-success';
        btn.innerHTML = 'Archive';
        btn.addEventListener('click', function() {
          fetch(`/emails/${mail.id}`, {
            method: 'PUT',
            body: JSON.stringify({
              archived: true
            })
          })
          load_mailbox('inbox');
        });
        document.querySelector('#archive').append(btn);
      }
      // Shows unarchive button on archived page
      else if(mail.archived===true) {
        btn.className = 'btn btn-outline-danger';
        btn.innerHTML = 'Unarchive';
        btn.addEventListener('click', function() {
          fetch(`/emails/${mail.id}`, {
            method: 'PUT',
            body: JSON.stringify({
              archived: false
            })
          })
          load_mailbox('inbox');
        });
        document.querySelector('#archive').append(btn);
      }
    }
  });
}