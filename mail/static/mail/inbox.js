document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');

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

  // Add mail to DOM
  document.querySelector('#mails-list').append(item);
}