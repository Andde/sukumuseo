export type Person = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  birthDate?: string;
  deathDate?: string;
  birthPlaceId?: string;
  occupation?: string;
  bio?: string;
  fatherId?: string;
  motherId?: string;
  spouseIds?: string[];
  childrenIds?: string[];
  photoIds?: string[];
  geniUrl?: string;
  familyBranchId?: string;
  // 128-dim face embeddings from face-api.js. Multiple per person to cover
  // ages / lighting. Used to suggest matches on new uploads.
  faceDescriptors?: number[][];
};

// Normalized bounding box (0..1) so it survives resizing.
export type FaceBox = {
  x: number;
  y: number;
  w: number;
  h: number;
  // Assigned person, once a human has confirmed the match.
  personId?: string;
  // Model's top guess before confirmation.
  suggestedPersonId?: string;
  confidence?: number;
  // Raw embedding — kept so we can add it to the Person's descriptor set
  // once confirmed.
  descriptor?: number[];
};

export type Photo = {
  id: string;
  title: string;
  description?: string;
  year?: number;
  imageUrl?: string;
  originalFilename?: string;
  uploadedAt?: string;
  placeId?: string;
  personIds?: string[];
  tags?: string[];
  faces?: FaceBox[];
};

export type Place = {
  id: string;
  name: string;
  municipality?: string;
  lat?: number;
  lng?: number;
  description?: string;
  photoIds?: string[];
  personIds?: string[];
};

export type Story = {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  content: string;
  yearFrom?: number;
  yearTo?: number;
  relatedPersons?: string[];
  relatedPlaces?: string[];
};

export type FamilyBranch = {
  id: string;
  name: string;
  description?: string;
  rootPersonId?: string;
};
