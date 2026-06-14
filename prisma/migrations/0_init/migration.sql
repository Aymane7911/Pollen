-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Region" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "code" TEXT,
    "description" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlantSpecies" (
    "id" SERIAL NOT NULL,
    "scientificName" TEXT NOT NULL,
    "commonName" TEXT,
    "commonNameAr" TEXT,
    "family" TEXT,
    "genus" TEXT,
    "nativeStatus" TEXT NOT NULL DEFAULT 'Unknown',
    "habitat" TEXT NOT NULL DEFAULT 'Unspecified',
    "floweringSeason" TEXT NOT NULL DEFAULT 'Unknown',
    "floweringMonths" TEXT,
    "isAllergenic" BOOLEAN NOT NULL DEFAULT false,
    "allergenicNotes" TEXT,
    "allergenWeight" INTEGER NOT NULL DEFAULT 0,
    "isBeeForage" BOOLEAN NOT NULL DEFAULT false,
    "isCultivationTarget" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "references" TEXT,
    "imagePath" TEXT,
    "createdById" TEXT,
    "createdByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlantSpecies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PollenType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "plantSpeciesId" INTEGER NOT NULL,
    "sizeMicronsMin" DOUBLE PRECISION,
    "sizeMicronsMax" DOUBLE PRECISION,
    "shape" TEXT NOT NULL DEFAULT 'Unknown',
    "apertures" TEXT NOT NULL DEFAULT 'Unknown',
    "surface" TEXT NOT NULL DEFAULT 'Unknown',
    "thresholdModerate" DOUBLE PRECISION,
    "thresholdHigh" DOUBLE PRECISION,
    "thresholdVeryHigh" DOUBLE PRECISION,
    "diagnosticFeatures" TEXT,
    "morphologyNotes" TEXT,
    "references" TEXT,
    "primaryImagePath" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "createdById" TEXT,
    "createdByName" TEXT,

    CONSTRAINT "PollenType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PollenRecord" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "pollenTypeId" INTEGER NOT NULL,
    "plantSpeciesId" INTEGER,
    "regionId" INTEGER,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "locationName" TEXT,
    "collectedOn" TIMESTAMP(3) NOT NULL,
    "year" INTEGER,
    "month" INTEGER,
    "season" TEXT,
    "source" TEXT NOT NULL DEFAULT 'FieldPlantSample',
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validatedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "collectorId" TEXT,
    "collectorName" TEXT,

    CONSTRAINT "PollenRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrapDevice" (
    "id" SERIAL NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "model" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "locationName" TEXT,
    "regionId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'Planned',
    "installedAt" TIMESTAMP(3),
    "lastMaintenance" TIMESTAMP(3),
    "isSolarPowered" BOOLEAN NOT NULL DEFAULT false,
    "hasWeatherSensors" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,

    CONSTRAINT "TrapDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AirborneSample" (
    "id" SERIAL NOT NULL,
    "trapDeviceId" INTEGER NOT NULL,
    "sampledFrom" TIMESTAMP(3) NOT NULL,
    "sampledTo" TIMESTAMP(3) NOT NULL,
    "volumeM3" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AirborneSample_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AirborneSamplePollenCount" (
    "id" SERIAL NOT NULL,
    "airborneSampleId" INTEGER NOT NULL,
    "pollenTypeId" INTEGER NOT NULL,
    "countGrains" INTEGER NOT NULL,
    "grainsPerCubicMeter" DOUBLE PRECISION,

    CONSTRAINT "AirborneSamplePollenCount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AirQualityReading" (
    "id" SERIAL NOT NULL,
    "measuredAt" TIMESTAMP(3) NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "stationName" TEXT,
    "regionId" INTEGER,
    "pm25" DOUBLE PRECISION,
    "pm10" DOUBLE PRECISION,
    "tempC" DOUBLE PRECISION,
    "humidityPct" DOUBLE PRECISION,
    "windSpeedMs" DOUBLE PRECISION,
    "windDirectionDeg" DOUBLE PRECISION,
    "rainfallMm" DOUBLE PRECISION,
    "dustEvent" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT,

    CONSTRAINT "AirQualityReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Beehive" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "owner" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "locationName" TEXT,
    "regionId" INTEGER,
    "colonies" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "installedAt" TIMESTAMP(3),
    "lastMovedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Beehive_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PollenImage" (
    "id" SERIAL NOT NULL,
    "pollenTypeId" INTEGER NOT NULL,
    "pollenRecordId" INTEGER,
    "filePath" TEXT NOT NULL,
    "caption" TEXT,
    "microscope" TEXT NOT NULL DEFAULT 'LightMicroscopy',
    "magnification" DOUBLE PRECISION,
    "stain" TEXT,
    "annotations" TEXT,
    "isValidated" BOOLEAN NOT NULL DEFAULT false,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PollenImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValidationLog" (
    "id" SERIAL NOT NULL,
    "pollenRecordId" INTEGER NOT NULL,
    "fromStatus" TEXT NOT NULL,
    "toStatus" TEXT NOT NULL,
    "actorId" TEXT,
    "actorName" TEXT,
    "comment" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ValidationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FloweringCalendarEntry" (
    "id" SERIAL NOT NULL,
    "plantSpeciesId" INTEGER NOT NULL,
    "regionId" INTEGER,
    "year" INTEGER NOT NULL,
    "startDoy" INTEGER NOT NULL,
    "endDoy" INTEGER NOT NULL,
    "peakDoy" INTEGER,
    "shiftDays" INTEGER NOT NULL DEFAULT 0,
    "carriedForward" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FloweringCalendarEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertRecipient" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'Authority',
    "email" TEXT,
    "phone" TEXT,
    "regionId" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlertRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertRule" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "regionId" INTEGER,
    "minScore" INTEGER NOT NULL DEFAULT 8,
    "notifyAuthorities" BOOLEAN NOT NULL DEFAULT true,
    "notifyHospitals" BOOLEAN NOT NULL DEFAULT true,
    "recommendedActions" TEXT,
    "cooldownHours" INTEGER NOT NULL DEFAULT 24,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlertRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" SERIAL NOT NULL,
    "alertRuleId" INTEGER,
    "regionId" INTEGER NOT NULL,
    "raisedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "riskLevel" TEXT NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,
    "recommendedActions" TEXT,
    "originLat" DOUBLE PRECISION,
    "originLng" DOUBLE PRECISION,
    "windFromDeg" DOUBLE PRECISION,
    "windSpeedMs" DOUBLE PRECISION,
    "bearingDeg" DOUBLE PRECISION,
    "halfAngleDeg" DOUBLE PRECISION,
    "radiusKm" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'Raised',
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "dispatchLog" TEXT,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "affiliation" TEXT,
    "orcId" TEXT,
    "title" TEXT,
    "role" TEXT NOT NULL DEFAULT 'Researcher',
    "emailConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "emailConfirmToken" TEXT,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "credentialPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlantSpecies_scientificName_key" ON "PlantSpecies"("scientificName");

-- CreateIndex
CREATE INDEX "PlantSpecies_family_idx" ON "PlantSpecies"("family");

-- CreateIndex
CREATE INDEX "PollenType_status_idx" ON "PollenType"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PollenRecord_code_key" ON "PollenRecord"("code");

-- CreateIndex
CREATE INDEX "PollenRecord_status_idx" ON "PollenRecord"("status");

-- CreateIndex
CREATE INDEX "PollenRecord_regionId_idx" ON "PollenRecord"("regionId");

-- CreateIndex
CREATE INDEX "PollenRecord_pollenTypeId_idx" ON "PollenRecord"("pollenTypeId");

-- CreateIndex
CREATE INDEX "PollenRecord_collectedOn_idx" ON "PollenRecord"("collectedOn");

-- CreateIndex
CREATE UNIQUE INDEX "TrapDevice_serialNumber_key" ON "TrapDevice"("serialNumber");

-- CreateIndex
CREATE INDEX "AirQualityReading_regionId_idx" ON "AirQualityReading"("regionId");

-- CreateIndex
CREATE INDEX "AirQualityReading_measuredAt_idx" ON "AirQualityReading"("measuredAt");

-- CreateIndex
CREATE INDEX "Beehive_isActive_idx" ON "Beehive"("isActive");

-- CreateIndex
CREATE INDEX "ValidationLog_pollenRecordId_idx" ON "ValidationLog"("pollenRecordId");

-- CreateIndex
CREATE INDEX "FloweringCalendarEntry_year_idx" ON "FloweringCalendarEntry"("year");

-- CreateIndex
CREATE UNIQUE INDEX "FloweringCalendarEntry_plantSpeciesId_regionId_year_key" ON "FloweringCalendarEntry"("plantSpeciesId", "regionId", "year");

-- CreateIndex
CREATE INDEX "Alert_raisedAt_idx" ON "Alert"("raisedAt");

-- CreateIndex
CREATE INDEX "Alert_regionId_status_idx" ON "Alert"("regionId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_emailConfirmToken_key" ON "User"("emailConfirmToken");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- AddForeignKey
ALTER TABLE "PollenType" ADD CONSTRAINT "PollenType_plantSpeciesId_fkey" FOREIGN KEY ("plantSpeciesId") REFERENCES "PlantSpecies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PollenRecord" ADD CONSTRAINT "PollenRecord_pollenTypeId_fkey" FOREIGN KEY ("pollenTypeId") REFERENCES "PollenType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PollenRecord" ADD CONSTRAINT "PollenRecord_plantSpeciesId_fkey" FOREIGN KEY ("plantSpeciesId") REFERENCES "PlantSpecies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PollenRecord" ADD CONSTRAINT "PollenRecord_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrapDevice" ADD CONSTRAINT "TrapDevice_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AirborneSample" ADD CONSTRAINT "AirborneSample_trapDeviceId_fkey" FOREIGN KEY ("trapDeviceId") REFERENCES "TrapDevice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AirborneSamplePollenCount" ADD CONSTRAINT "AirborneSamplePollenCount_airborneSampleId_fkey" FOREIGN KEY ("airborneSampleId") REFERENCES "AirborneSample"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AirborneSamplePollenCount" ADD CONSTRAINT "AirborneSamplePollenCount_pollenTypeId_fkey" FOREIGN KEY ("pollenTypeId") REFERENCES "PollenType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AirQualityReading" ADD CONSTRAINT "AirQualityReading_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Beehive" ADD CONSTRAINT "Beehive_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PollenImage" ADD CONSTRAINT "PollenImage_pollenTypeId_fkey" FOREIGN KEY ("pollenTypeId") REFERENCES "PollenType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PollenImage" ADD CONSTRAINT "PollenImage_pollenRecordId_fkey" FOREIGN KEY ("pollenRecordId") REFERENCES "PollenRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidationLog" ADD CONSTRAINT "ValidationLog_pollenRecordId_fkey" FOREIGN KEY ("pollenRecordId") REFERENCES "PollenRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FloweringCalendarEntry" ADD CONSTRAINT "FloweringCalendarEntry_plantSpeciesId_fkey" FOREIGN KEY ("plantSpeciesId") REFERENCES "PlantSpecies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FloweringCalendarEntry" ADD CONSTRAINT "FloweringCalendarEntry_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertRecipient" ADD CONSTRAINT "AlertRecipient_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertRule" ADD CONSTRAINT "AlertRule_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_alertRuleId_fkey" FOREIGN KEY ("alertRuleId") REFERENCES "AlertRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

