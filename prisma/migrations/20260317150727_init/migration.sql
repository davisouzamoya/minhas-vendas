-- CreateTable
CREATE TABLE "Transaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "produto" TEXT,
    "categoria" TEXT,
    "quantidade" REAL,
    "valorUnitario" REAL,
    "valorTotal" REAL NOT NULL,
    "formaPagamento" TEXT,
    "data" DATETIME NOT NULL,
    "mensagemOriginal" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
