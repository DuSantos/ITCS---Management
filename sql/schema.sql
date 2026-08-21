-- Execute este script na sua base de dados para criar as tabelas necessárias

CREATE TABLE users (
    id NVARCHAR(50) PRIMARY KEY,
    first_name NVARCHAR(100) NOT NULL,
    last_name NVARCHAR(100) NOT NULL,
    email NVARCHAR(200) UNIQUE NOT NULL,
    password_hash NVARCHAR(MAX) NOT NULL,
    mfa_secret NVARCHAR(100),
    mfa_enabled BIT DEFAULT 0
);

CREATE TABLE Assets (
    id NVARCHAR(50) PRIMARY KEY,
    consultantName NVARCHAR(200) NOT NULL,
    managerName NVARCHAR(200) NOT NULL,
    teamMember NVARCHAR(200) NOT NULL,
    equipmentSpecs NVARCHAR(MAX) NOT NULL,
    proposalNumber NVARCHAR(100) NOT NULL,
    serialNumber NVARCHAR(100) NOT NULL,
    qrCode NVARCHAR(100),
    poNumber NVARCHAR(100) NOT NULL,
    durationMonths INT NOT NULL,
    startDate DATE NOT NULL,
    endDate DATE NOT NULL,
    monthlyValueExvat DECIMAL(18, 2) NOT NULL,
    monthlyValueIncVat DECIMAL(18, 2) NOT NULL,
    status NVARCHAR(50) NOT NULL,
    project NVARCHAR(200),
    observations NVARCHAR(MAX),
    company NVARCHAR(100) NOT NULL,
    location NVARCHAR(100) NOT NULL,
    lastUpdated DATETIME2 DEFAULT GETDATE()
);

-- Exemplo de índice para melhorar performance de pesquisa
CREATE INDEX IX_Assets_Consultant ON Assets (consultantName);
