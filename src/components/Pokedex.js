import React, { useState, useEffect } from 'react';
import { Search, Heart, HeartOff, Filter, X } from 'lucide-react';

const PokemonCard = ({ pokemon, isFavorite, onToggleFavorite, onSelect }) => (
  <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer"
       onClick={() => onSelect(pokemon)}>
    <div className="relative">
      <img 
        src={pokemon.sprites.front_default} 
        alt={pokemon.name}
        className="w-32 h-32 mx-auto"
      />
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite(pokemon);
        }}
        className="absolute top-0 right-0 p-2"
      >
        {isFavorite ? 
          <Heart className="w-6 h-6 text-red-500 fill-current" /> : 
          <HeartOff className="w-6 h-6 text-gray-400" />
        }
      </button>
    </div>
    <h3 className="text-lg font-semibold text-center capitalize mt-2">{pokemon.name}</h3>
    <div className="flex flex-wrap gap-1 justify-center mt-2">
      {pokemon.types.map(({ type }) => (
        <span 
          key={type.name}
          className="px-2 py-1 text-sm rounded-full bg-gray-100"
        >
          {type.name}
        </span>
      ))}
    </div>
  </div>
);

const DetailModal = ({ pokemon, onClose }) => {
  if (!pokemon) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-start">
          <h2 className="text-2xl font-bold capitalize">{pokemon.name}</h2>
          <button onClick={onClose} className="p-1">
            <X className="w-6 h-6" />
          </button>
        </div>
        <img 
          src={pokemon.sprites.front_default} 
          alt={pokemon.name}
          className="w-48 h-48 mx-auto"
        />
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">Types</h3>
            <div className="flex gap-2">
              {pokemon.types.map(({ type }) => (
                <span 
                  key={type.name}
                  className="px-2 py-1 text-sm rounded-full bg-gray-100"
                >
                  {type.name}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-semibold">Stats</h3>
            <div className="space-y-2">
              {pokemon.stats.map(({ stat, base_stat }) => (
                <div key={stat.name} className="flex items-center">
                  <span className="w-24 capitalize">{stat.name}:</span>
                  <div className="flex-1 h-2 bg-gray-200 rounded">
                    <div 
                      className="h-full bg-blue-500 rounded"
                      style={{ width: `${(base_stat / 255) * 100}%` }}
                    />
                  </div>
                  <span className="ml-2 w-8">{base_stat}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-semibold">Abilities</h3>
            <div className="flex flex-wrap gap-2">
              {pokemon.abilities.map(({ ability }) => (
                <span 
                  key={ability.name}
                  className="px-2 py-1 text-sm rounded-full bg-gray-100"
                >
                  {ability.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Pokedex = () => {
  const [pokemon, setPokemon] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [availableTypes, setAvailableTypes] = useState([]);

  const ITEMS_PER_PAGE = 12;

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const response = await fetch('https://pokeapi.co/api/v2/type');
        const data = await response.json();
        setAvailableTypes(data.results.map(type => type.name));
      } catch (err) {
        console.error('Error fetching types:', err);
      }
    };

    fetchTypes();
  }, []);

  useEffect(() => {
    const fetchPokemon = async () => {
      try {
        setLoading(true);
        const offset = (currentPage - 1) * ITEMS_PER_PAGE;
        const response = await fetch(
          `https://pokeapi.co/api/v2/pokemon?limit=${ITEMS_PER_PAGE}&offset=${offset}`
        );
        const data = await response.json();
        
        const pokemonDetails = await Promise.all(
          data.results.map(async (pokemon) => {
            const res = await fetch(pokemon.url);
            return res.json();
          })
        );
        
        setPokemon(pokemonDetails);
        setError(null);
      } catch (err) {
        setError('Failed to fetch Pokemon');
      } finally {
        setLoading(false);
      }
    };

    fetchPokemon();
  }, [currentPage]);

  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  const filteredPokemon = pokemon.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedTypes.length === 0 || 
      p.types.some(({ type }) => selectedTypes.includes(type.name));
    return matchesSearch && matchesType;
  });

  const toggleFavorite = (pokemon) => {
    setFavorites(prev => {
      const isFavorite = prev.some(f => f.id === pokemon.id);
      if (isFavorite) {
        return prev.filter(f => f.id !== pokemon.id);
      } else {
        return [...prev, pokemon];
      }
    });
  };

  if (error) {
    return (
      <div className="text-center p-4">
        <p className="text-red-500">{error}</p>
        <button 
          onClick={() => setCurrentPage(1)}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-8">Pokedex</h1>
      
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search Pokemon..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Filter className="w-6 h-6 text-gray-400" />
          {availableTypes.map(type => (
            <button
              key={type}
              onClick={() => setSelectedTypes(prev => 
                prev.includes(type) 
                  ? prev.filter(t => t !== type)
                  : [...prev, type]
              )}
              className={`px-3 py-1 rounded-full text-sm ${
                selectedTypes.includes(type)
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredPokemon.map((p) => (
              <PokemonCard
                key={p.id}
                pokemon={p}
                isFavorite={favorites.some(f => f.id === p.id)}
                onToggleFavorite={toggleFavorite}
                onSelect={setSelectedPokemon}
              />
            ))}
          </div>

          <div className="flex justify-center gap-4 mt-6">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2">Page {currentPage}</span>
            <button
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              Next
            </button>
          </div>
        </>
      )}

      {selectedPokemon && (
        <DetailModal
          pokemon={selectedPokemon}
          onClose={() => setSelectedPokemon(null)}
        />
      )}
    </div>
  );
};

export default Pokedex;