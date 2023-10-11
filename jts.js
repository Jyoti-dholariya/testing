const mysql = require('mysql2');
const { Client } = require('ssh2');
const express = require('express');
const app = express();
const port = 3400;

// SSH connection configuration
const sshConfig = {
  host: '139.59.1.13', // SSH server hostname
  port: 22, // SSH port (default is 22)
  username: 'root', // SSH username
  password: 'eLision@123e',
};


// MySQL connection configuration (through the SSH tunnel)
const mysqlConfig = {
  host: 'localhost', // Hostname after SSH tunnel
  user: 'root', // MySQL username
  password: 'Elision@789', // MySQL password
  database: 'dummy_db', // MySQL database name
};

// Create an SSH tunnel
const sshTunnel = new Client();

sshTunnel.on('ready', () => {
  sshTunnel.forwardOut(
    'localhost', // Bind address (your local machine)
    3306, // Local port for MySQL (can be any available port)
    'localhost', // Remote MySQL server address (usually localhost)
    3306, // Remote MySQL server port (default is 3306)
    (err, stream) => {
      if (err) throw err;

      // Create a MySQL connection using the SSH tunnel's stream
      const connection = mysql.createConnection({
        ...mysqlConfig,
        stream,
      });

      // Start the Express server after establishing the MySQL connection
      app.listen(port, () => {
        console.log(`API server is running on port ${port}`);
      });

      // Define the '/users' route
      app.get('/users', (req, res) => {
        const query = 'SELECT * FROM users';
        connection.query(query, (err, results) => {
          if (err) {
            res.status(500).json({ error: 'Database error' });
          } else {
            res.json(results);
          }
        });
      });
    }
  );
});

// Connect to the SSH server
sshTunnel.connect(sshConfig);
