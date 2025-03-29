import { useEffect, useState } from "react";
import { getPokedexNumber, getFullPokedexNumber } from "../utils";
import  TypeCard from "./TypeCard";

export default function PokeCard(props) {
    const {selectedPokemon} = props;
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    const {name,height,abilities,stats,types,moves,sprites} = data || {};

    useEffect(() => {
        // if loading, exit logic
        if (loading || !localStorage) {return};

        // check if the selectedPokemon information is available in the cache
        // 1. Define the chache
        let cache = {}
        if (localStorage.getItem("pokedex")) {
            cache = JSON.parse(localStorage.getItem("pokedex"));
        }

        // 2. Checki fi the selectedPokemon is in the cache, otherwise fetch it from the API
        if(selectedPokemon in cache){
            // read from cache
            setData(cache[selectedPokemon]);
            return;
        } 

        // 3. Fetch the data from the API
        async function fetchPokemonData() {
            setLoading(true);
            try {
                const baseUrl = "https://pokeapi.co/api/v2/";
                const suffix =  "pokemon/" + getPokedexNumber(selectedPokemon);
                const finalUrl = baseUrl + suffix;
                const res = await fetch(finalUrl);
                const pokemonData = await res.json();
                setData(pokemonData);
                console.log(pokemonData);
                cache[selectedPokemon] = pokemonData;
                localStorage.setItem("pokedex", JSON.stringify(cache));
            } catch (err) {
                console.log(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchPokemonData();
        // if we fetched the data from the API, we need to update the cache with the new data
    },[selectedPokemon])

    if (loading || !data) {
        return (
            <div>
                <h2>Loading...</h2>
            </div>
        )
    }

    return (
        <div className="poke-card">
            <div>
                <h4>#{getFullPokedexNumber(selectedPokemon)}</h4>
                <h2>{name}</h2>
            </div>
            <div className="type-container">
                {types.map((typeObj, typeIndex) => {
                    return (
                        <TypeCard key={typeIndex} type={typeObj?.type?.name} />
                    )
                })}
            </div>
            <img className="default-img" src={'/pokemon/' + getFullPokedexNumber(selectedPokemon) + '.png'} alt={`${name}-large-img`} />
        </div>
    )
}