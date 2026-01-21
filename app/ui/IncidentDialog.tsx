"use client";

import React, { useState, useRef, useEffect } from "react";
import { IncidentType, Location } from "../api/types";
import { TextInput } from "./TextInput";
import { PillButton, DefaultButton } from "./button";
import getCurrLocation from "../map/mapUtils"
import { getToken } from "../actions/auth";
import { formatInTimeZone, format } from 'date-fns-tz';

interface IncidentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (incident: {
    incidentType: IncidentType;
    title: string;
    description?: string;
    location: Location;
  }) => void;
  selectedIncidentType: IncidentType;
  providedLocation : Location | null;
}

export function IncidentDialog({
  isOpen,
  onClose,
  onSubmit,
  selectedIncidentType,
  providedLocation,
}: IncidentDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [incidentType, setIncidentType] = useState<IncidentType>(selectedIncidentType);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState<Location | null>(null);

  useEffect(() => {
    if (dialogRef.current) {
      if (isOpen) {
        dialogRef.current.showModal();
        if (!providedLocation) {
            getCurrLocation().then(
                (currLocation) => setLocation(currLocation)
            );

            
        } else {
            setLocation(providedLocation);
            console.log("Provided Location", providedLocation, location);
        }
      } else {
        dialogRef.current.close();
      }
    }
  }, [isOpen, providedLocation]);

  useEffect(() => {
    if (selectedIncidentType) {
      setIncidentType(selectedIncidentType);
    }
  }, [selectedIncidentType]);

  const getLocalTimestamp = () => {
    const now = new Date();

    // Date: YYYY-MM-DD
    const date = now.toLocaleDateString('en-CA');

    // Time: 24-hour format HH:mm:ss
    const time = now.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    // Short timezone name (e.g., "WAT", "EST", "CET", "IST")
    const shortName = new Intl.DateTimeFormat('en-US', {
      timeZoneName: 'short',
    })
      .formatToParts(now)
      .find(part => part.type === 'timeZoneName')?.value;

    // Offset: GMT+01:00 or GMT-05:00
    const offsetTotal = now.getTimezoneOffset();
    const offset = -offsetTotal; // Flip for correct sign
    const sign = offset >= 0 ? '+' : '-';
    const abs = Math.abs(offset);
    const hours = Math.floor(abs / 60).toString().padStart(2, '0');
    const mins = (abs % 60).toString().padStart(2, '0');
    const offsetStr = `GMT${sign}${hours}:${mins}`;

    // Final: "2025-12-30 14:30:45 (GMT+01:00, WAT)"
    return `${date} ${time} (${offsetStr}, ${shortName})`;
}

const parseLocalTimestampToUTC = (stored: string) => {
    // Input example: "2025-12-30 14:30:45 (GMT+01:00, WAT)"

    // Extract offset: GMT+01:00 or GMT-05:30
    const offsetMatch = stored.match(/GMT([+-]\d{2}:\d{2})/);
    if (!offsetMatch) throw new Error("Cannot find offset in string");

    const offsetStr = offsetMatch[1]; // "+01:00" or "-05:30"
    const sign = offsetStr[0] === '+' ? 1 : -1;
    const [h, m] = offsetStr.slice(1).split(':').map(Number);
    const offsetMinutes = sign * (h * 60 + m);

    // Extract date + time part
    const dateTimeStr = stored.split(' (')[0].trim(); // "2025-12-30 14:30:45"

    // Create Date object from local time string
    const localDate = new Date(dateTimeStr);

    if (isNaN(localDate.getTime())) {
      throw new Error("Invalid date format");
    }

    // Convert to UTC by subtracting the local offset
    const utcDate = new Date(localDate.getTime() - offsetMinutes * 60000);

    return utcDate;
}

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (incidentType === IncidentType.NONE) {
        return;
    }

    if (!title.trim() || (!(location) && !(providedLocation))) {
        onClose();
    }
    
    onSubmit({
      incidentType,
      title: title.trim(),
      description: description.trim() || undefined,
      location: location!,
    });

    try 
        {
          const idToken = await getToken()
          //Now adds location pins for today with specific timestampes including the timeozone for the user
          //So that when populating it can be accurate for all users by converting to UTC later ons
          let dateTime  = getLocalTimestamp();

          const bodyData = 
          { 
            incidentType: incidentType,
            title: title.trim(),
            description: description.trim(),
            location: location!,
            dateTime: dateTime
          }

          console.log("Submitting incident data:", bodyData);

          const response = await fetch(`/api/dataHandler`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',  // ← Critical for JSON body
          },
          body: JSON.stringify(bodyData),
        });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Request failed:', response.status, errorText);
        return;
      }

      console.log("Successfully stored pin data")
      
        } catch (err)
        {
          console.log("Handling Pin Addition Error: ",err )
        }

    handleClose()
  };

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setIncidentType(IncidentType.OTHER);
    setLocation(null);
    providedLocation = null;
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      className="bg-white rounded-lg p-6 shadow-lg max-w-md w-full backdrop:backdrop-blur-sm backdrop:bg-white/30 fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
      onClose={handleClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Report Incident</h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Incident Type
          </label>
          <select
            value={incidentType}
            onChange={(e) => setIncidentType(e.target.value as IncidentType)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {Object.values(IncidentType).map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <TextInput
          type="text"
          placeholder="Brief incident title"
          title="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <div>
          <label className="block text-sm font-medium mb-2">
            Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Additional details about the incident..."
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={3}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <DefaultButton
            type="button"
            onClick={handleClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </DefaultButton>
          <PillButton
            type="submit"
            className="flex-1 rounded-md"
            disabled={!title.trim() || !location}
          >
            Report Incident
          </PillButton>
        </div>
      </form>
    </dialog>
  );
}
