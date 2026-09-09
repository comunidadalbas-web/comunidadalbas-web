"use client";

import { useState, useEffect, useReducer } from 'react';
import { useParams } from 'next/navigation';

interface ListingState {
  loading: boolean;
  error: string | null;
  listing: null | {
    title: string;
    propertyCode: string;
    monthlyRent: number;
    status: string;
    bedrooms: number;
    bathrooms: number;
    ownerVerified: boolean;
  };
}

const initialState: ListingState = {
  loading: true,
  error: null,
  listing: null,
};

function listingReducer(state: ListingState, action: any): ListingState {
  switch (action.type) {
    case 'setListing':
      return { ...state, listing: action.listing, loading: false };
    case 'setError':
      return { ...state, error: action.error };
    case 'setLoading':
      return { ...state, loading: action.loading };
    default:
      return state;
  }
}

interface JsonResponse {
  [key: string]: any;
}

export default function AdminRentasDetail() {
  const { id } = useParams();

  const [state, dispatch] = useReducer(listingReducer, initialState);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/admin/rentas/${id}`, {
          credentials: 'include',
        });
        const data: JsonResponse = await res.json;
        if (res.ok) {
          dispatch({ type: 'setListing', listing: data });
        } else {
          dispatch({ type: 'setError', error: data.error || 'Error al cargar el listado' });
        }
      } catch (e) {
        dispatch({ type: 'setError', error: 'Error de red' });
      } finally {
        dispatch({ type: 'setLoading', loading: false });
      }
    })();
  }, [id]);

  if (state.loading) {
    return <div>Cargando...</div>;
  }

  if (state.error) {
    return <div>Error: {state.error}</div>;
  }

  if (!state.listing) {
    return <div>Listado no encontrado</div>;
  }

  return (
    <div>
      <h2>{state.listing.title}</h2>
      <p>Código: {state.listing.propertyCode}</p>
      <p>Renta: {state.listing.monthlyRent} MXN</p>
      <p>Estado: {state.listing.status}</p>
      <p>Habitaciones: {state.listing.bedrooms}</p>
      <p>Baños: {state.listing.bathrooms}</p>
      <p>Propietario verificado: {state.listing.ownerVerified ? 'Sí' : 'No'}</p>
    </div>
  );
}