-- CreateTable
CREATE TABLE "BookerArtist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookerId" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BookerArtist_bookerId_fkey" FOREIGN KEY ("bookerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BookerArtist_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Promoter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "company" TEXT,
    "headquarters" TEXT,
    "siret" TEXT,
    "ape" TEXT,
    "vatNumber" TEXT,
    "signatory" TEXT,
    "signatoryRole" TEXT,
    "notes" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Promoter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "time" TEXT,
    "promoter" TEXT NOT NULL,
    "promoterId" TEXT,
    "venue" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "fee" REAL NOT NULL DEFAULT 0,
    "contractSigned" BOOLEAN NOT NULL DEFAULT false,
    "agencyFeesPaid" BOOLEAN NOT NULL DEFAULT false,
    "artistFeesPaid" BOOLEAN NOT NULL DEFAULT false,
    "transportBooked" BOOLEAN NOT NULL DEFAULT false,
    "transportInfo" TEXT,
    "hotelBooked" BOOLEAN NOT NULL DEFAULT false,
    "hotelInfo" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "googleCalendarEventId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Booking_promoterId_fkey" FOREIGN KEY ("promoterId") REFERENCES "Promoter" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Booking" ("agencyFeesPaid", "artistFeesPaid", "city", "contractSigned", "country", "createdAt", "date", "fee", "hotelBooked", "hotelInfo", "id", "notes", "promoter", "status", "time", "transportBooked", "transportInfo", "updatedAt", "userId", "venue") SELECT "agencyFeesPaid", "artistFeesPaid", "city", "contractSigned", "country", "createdAt", "date", "fee", "hotelBooked", "hotelInfo", "id", "notes", "promoter", "status", "time", "transportBooked", "transportInfo", "updatedAt", "userId", "venue" FROM "Booking";
DROP TABLE "Booking";
ALTER TABLE "new_Booking" RENAME TO "Booking";
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "image" TEXT,
    "role" TEXT,
    "artistName" TEXT,
    "googleCalendarEnabled" BOOLEAN NOT NULL DEFAULT false,
    "googleCalendarId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "email", "emailVerified", "id", "image", "name", "role", "updatedAt") SELECT "createdAt", "email", "emailVerified", "id", "image", "name", "role", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "BookerArtist_bookerId_artistId_key" ON "BookerArtist"("bookerId", "artistId");
