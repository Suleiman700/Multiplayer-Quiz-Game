import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface DatabaseConfig {
  host: string;
  user: string;
  password: string;
  database: string;
  port?: number;
}

interface TestResult {
  success: boolean;
  message: string;
  details?: any;
}

export async function testMySQLConnection(config?: DatabaseConfig): Promise<TestResult> {
  const dbConfig: DatabaseConfig = config || {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'quiz_game',
    port: parseInt(process.env.DB_PORT || '3306', 10),
  };

  console.log('Testing MySQL connection with config:');
  console.log(`Host: ${dbConfig.host}`);
  console.log(`User: ${dbConfig.user}`);
  console.log(`Database: ${dbConfig.database}`);
  console.log(`Port: ${dbConfig.port}`);
  console.log('Password: ' + (dbConfig.password ? '[SET]' : '[NOT SET]'));
  console.log('---');

  let connection: mysql.Connection | null = null;

  try {
    // Step 1: Test basic connection to MySQL server (without database)
    console.log('Step 1: Testing connection to MySQL server...');
    connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      port: dbConfig.port,
    });

    console.log('✅ Successfully connected to MySQL server');

    // Step 2: Test if database exists
    console.log(`Step 2: Checking if database '${dbConfig.database}' exists...`);
    const [databases] = await connection.execute(
      `SHOW DATABASES LIKE '${dbConfig.database}'`
    );

    if ((databases as any[]).length === 0) {
      console.log(`⚠️  Database '${dbConfig.database}' does not exist`);
      console.log(`Creating database '${dbConfig.database}'...`);
      
      await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
      console.log(`✅ Database '${dbConfig.database}' created successfully`);
    } else {
      console.log(`✅ Database '${dbConfig.database}' exists`);
    }

    // Step 3: Test connection to specific database
    console.log(`Step 3: Testing connection to database '${dbConfig.database}'...`);
    await connection.end();
    
    connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
      port: dbConfig.port,
    });

    console.log(`✅ Successfully connected to database '${dbConfig.database}'`);

    // Step 4: Test basic query
    console.log('Step 4: Testing basic query...');
    const [result] = await connection.execute('SELECT 1 as test');
    console.log('✅ Basic query successful:', result);

    // Step 5: Test table creation permissions
    console.log('Step 5: Testing table creation permissions...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS connection_test (
        id INT AUTO_INCREMENT PRIMARY KEY,
        test_value VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table creation successful');

    // Step 6: Test insert/select operations
    console.log('Step 6: Testing insert/select operations...');
    const testValue = `test_${Date.now()}`;
    await connection.execute(
      `INSERT INTO connection_test (test_value) VALUES ('${testValue}')`
    );
    
    const [rows] = await connection.execute(
      `SELECT * FROM connection_test WHERE test_value = '${testValue}'`
    );
    console.log('✅ Insert/Select operations successful:', rows);

    // Cleanup test table
    await connection.execute('DROP TABLE IF EXISTS connection_test');
    console.log('✅ Cleanup completed');

    return {
      success: true,
      message: 'All MySQL connection tests passed successfully!',
      details: {
        config: dbConfig,
        serverVersion: await getServerVersion(connection),
      }
    };

  } catch (error: any) {
    console.error('❌ MySQL connection test failed:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    let troubleshootingTips: string[] = [];
    
    switch (error.code) {
      case 'ECONNREFUSED':
        troubleshootingTips = [
          'MySQL server is not running',
          'Check if MySQL service is started',
          'Verify the host and port are correct',
          'Check firewall settings'
        ];
        break;
      case 'ER_ACCESS_DENIED_ERROR':
        troubleshootingTips = [
          'Invalid username or password',
          'User does not have sufficient privileges',
          'Check MySQL user permissions'
        ];
        break;
      case 'ENOTFOUND':
        troubleshootingTips = [
          'Host not found',
          'Check if the hostname is correct',
          'Verify network connectivity'
        ];
        break;
      case 'ETIMEDOUT':
        troubleshootingTips = [
          'Connection timeout',
          'MySQL server may be overloaded',
          'Check network connectivity',
          'Verify firewall settings'
        ];
        break;
      default:
        troubleshootingTips = [
          'Check MySQL server logs',
          'Verify all configuration parameters',
          'Ensure MySQL server is properly configured'
        ];
    }

    console.log('\n🔧 Troubleshooting tips:');
    troubleshootingTips.forEach((tip, index) => {
      console.log(`${index + 1}. ${tip}`);
    });

    return {
      success: false,
      message: `MySQL connection failed: ${error.message}`,
      details: {
        code: error.code,
        errno: error.errno,
        sqlState: error.sqlState,
        troubleshooting: troubleshootingTips
      }
    };
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function getServerVersion(connection: mysql.Connection): Promise<string> {
  try {
    const [result] = await connection.execute('SELECT VERSION() as version');
    return (result as any[])[0]?.version || 'Unknown';
  } catch {
    return 'Unknown';
  }
}

// CLI interface
if (require.main === module) {
  console.log('🔍 MySQL Connection Test Utility');
  console.log('================================\n');

  testMySQLConnection()
    .then((result) => {
      if (result.success) {
        console.log('\n🎉 SUCCESS:', result.message);
        if (result.details?.serverVersion) {
          console.log(`MySQL Version: ${result.details.serverVersion}`);
        }
        process.exit(0);
      } else {
        console.log('\n💥 FAILURE:', result.message);
        console.log('\nNext steps:');
        console.log('1. Fix the issues mentioned above');
        console.log('2. Run this test again: npm run test:mysql');
        console.log('3. Once MySQL is working, run: npm run seed');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('\n💥 Unexpected error:', error);
      process.exit(1);
    });
}
