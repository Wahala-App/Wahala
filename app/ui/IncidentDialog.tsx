"use client";

import React, { useState, useRef, useEffect } from "react";
import { IncidentType } from "../api/types";
import { TextInput } from "./TextInput";
import { PillButton, DefaultButton } from "./button";

interface IncidentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (incident: {
    incidentType: IncidentType;
    title: string;
    description?: string;
    location: { latitude: number; longitude: number };
  }) => void;
  selectedIncidentType?: IncidentType;
}

export function IncidentDialog({
  isOpen,
  onClose,
  onSubmit,
  selectedIncidentType,
}: IncidentDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [incidentType, setIncidentType] = useState<IncidentType>(
    selectedIncidentType || IncidentType.OTHER
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    if (dialogRef.current) {
      if (isOpen) {
        dialogRef.current.showModal();
        getCurrentLocation();
      } else {
        dialogRef.current.close();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedIncidentType) {
      setIncidentType(selectedIncidentType);
    }
  }, [selectedIncidentType]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => {
          setLocation({ latitude: 32.4173824, longitude: -81.7856512 });
        }
      );
    } else {
      setLocation({ latitude: 32.4173824, longitude: -81.7856512 });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !location) return;

    onSubmit({
      incidentType,
      title: title.trim(),
      description: description.trim() || undefined,
      location,
    });

    setTitle("");
    setDescription("");
    setIncidentType(IncidentType.OTHER);
    onClose();
  };

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setIncidentType(selectedIncidentType || IncidentType.OTHER);
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
