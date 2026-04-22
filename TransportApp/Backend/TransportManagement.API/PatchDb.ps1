$connString = "Server=DESARROLLOS\SRVRMCS;Database=TransportManagementDB;Trusted_Connection=True;TrustServerCertificate=True;"
$conn = New-Object System.Data.SqlClient.SqlConnection($connString)
$conn.Open()

# Asegurarse de que el usuario Admin exista
$cmd = $conn.CreateCommand()
$cmd.CommandText = "IF NOT EXISTS (SELECT 1 FROM Users WHERE Username='admin') BEGIN INSERT INTO Users (Username, PasswordHash, FullName, IsSuperAdmin, IsActive) VALUES ('admin', 'admin123', 'System Administrator', 1, 1); END"
$cmd.ExecuteNonQuery() | Out-Null

# Asociarlo a la compañia 0
$cmd.CommandText = "IF NOT EXISTS (SELECT 1 FROM UserCompanies WHERE UserId=(SELECT TOP 1 Id FROM Users WHERE Username='admin') AND CompanyId=0) BEGIN INSERT INTO UserCompanies (UserId, CompanyId) VALUES ((SELECT TOP 1 Id FROM Users WHERE Username='admin'), 0); END"
$cmd.ExecuteNonQuery() | Out-Null

$conn.Close()
Write-Host "Base de datos parcheada exitosamente."
