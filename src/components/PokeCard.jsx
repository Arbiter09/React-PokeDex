import { useEffect, useState } from "react";
import { getPokedexNumber, getFullPokedexNumber } from "../utils";
import TypeCard from "./TypeCard";
import Modal from "./Modal";

export default function PokeCard(props) {
    const { selectedPokemon } = props;
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [skill, setSkill] = useState(null);
    const [loadingSkill, setLoadingSkill] = useState(false);
    const [activeMovesTab, setActiveMovesTab] = useState(0);
    const movesPerPage = 21; // Changed from 20 to 21
    const movesPerRow = 3; // Ensuring consistent grid layout

    const { name, height, abilities, stats, types, moves, sprites } = data || {};

    const imgList = Object.keys(sprites || {}).filter(val => {
        if (!sprites[val]) return false;
        if (val === "other") return false;
        if (val === "versions") return false;
        return true;
    });

    // Calculate total number of tabs needed
    const totalMovesTabs = moves ? Math.ceil(moves.length / movesPerPage) : 0;

    async function fetchMoveData(move, moveUrl) {
        if (loadingSkill || !localStorage || !moveUrl) return;

        // check cache for move
        let c = {};
        if (localStorage.getItem('pokemon-moves')) {
            c = JSON.parse(localStorage.getItem('pokemon-moves'));
        }

        if (move in c) {
            setSkill(c[move]);
            return;
        }

        try {
            setLoadingSkill(true);
            const res = await fetch(moveUrl);
            const moveData = await res.json();

            const description = moveData?.flavor_text_entries.filter(val => {
                return val.version_group.name === 'firered-leafgreen';
            })[0]?.flavor_text;

            const skillData = {
                name: move,
                description
            };

            setSkill(skillData);
            c[move] = skillData;
            localStorage.setItem('pokemon-moves', JSON.stringify(c));
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingSkill(false);
        }
    }

    useEffect(() => {
        if (loading || !localStorage) return;

        // Check cache
        let cache = {};
        if (localStorage.getItem("pokedex")) {
            cache = JSON.parse(localStorage.getItem("pokedex"));
        }

        if (selectedPokemon in cache) {
            setData(cache[selectedPokemon]);
            return;
        }

        // Fetch data
        async function fetchPokemonData() {
            setLoading(true);
            try {
                const baseUrl = "https://pokeapi.co/api/v2/";
                const suffix = "pokemon/" + getPokedexNumber(selectedPokemon);
                const finalUrl = baseUrl + suffix;
                const res = await fetch(finalUrl);
                const pokemonData = await res.json();
                setData(pokemonData);
                cache[selectedPokemon] = pokemonData;
                localStorage.setItem("pokedex", JSON.stringify(cache));
            } catch (err) {
                console.error(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchPokemonData();
    }, [selectedPokemon, loading]);

    // Reset active tab when Pokemon changes
    useEffect(() => {
        setActiveMovesTab(0);
    }, [selectedPokemon]);

    if (loading || !data) {
        return (
            <div className="loading-container">
                <div className="loader"></div>
                <h2 className="loading-text">Loading Pokémon data...</h2>
            </div>
        );
    }

    // Get current page of moves and ensure grid completeness
    const getCurrentPageMoves = () => {
        if (!moves) return [];
        const startIndex = activeMovesTab * movesPerPage;
        const endIndex = startIndex + movesPerPage;
        const currentMoves = moves.slice(startIndex, endIndex);
        
        // Calculate how many placeholder items we need to add to complete the grid
        const remainder = currentMoves.length % movesPerRow;
        const placeholdersNeeded = remainder === 0 ? 0 : movesPerRow - remainder;
        
        // Add placeholder items if needed
        const result = [...currentMoves];
        for (let i = 0; i < placeholdersNeeded; i++) {
            result.push({ isPlaceholder: true });
        }
        
        return result;
    };

    // Adjust tab labels to reflect the new moves per page count
    const getTabLabel = (tabIndex) => {
        const startNum = tabIndex * movesPerPage + 1;
        const endNum = Math.min((tabIndex + 1) * movesPerPage, moves?.length || 0);
        return `${startNum}-${endNum}`;
    };

    return (
        <div className="poke-card">
            {skill && (
                <Modal handleCloseModal={() => setSkill(null)}>
                    <div className="skill-header">
                        <h2 className="skill-name">{skill.name.replaceAll('-', ' ')}</h2>
                    </div>
                    <div className="skill-description">
                        <p>{skill.description || "No description available."}</p>
                    </div>
                </Modal>
            )}
            
            <div className="pokemon-header">
                <div className="pokemon-id-name">
                    <h4 className="pokemon-number">#{getFullPokedexNumber(selectedPokemon)}</h4>
                    <h2 className="pokemon-name">{name}</h2>
                </div>
                
                <div className="type-container">
                    {types?.map((typeObj, typeIndex) => (
                        <TypeCard key={typeIndex} type={typeObj?.type?.name} />
                    ))}
                </div>
            </div>
            
            <div className="pokemon-main-content">
                <img 
                    className="pokemon-image" 
                    src={'/pokemon/' + getFullPokedexNumber(selectedPokemon) + '.png'} 
                    alt={`${name}`} 
                />
                
                <div className="stats-container">
                    <h3 className="section-title">Stats</h3>
                    <div className="stats-grid">
                        {stats?.map((statObj, statIndex) => {
                            const { stat, base_stat } = statObj;
                            // Calculate percentage for stat bar (max base stat commonly considered as 255)
                            const percentage = Math.min(100, (base_stat / 255) * 100);
                            
                            return (
                                <div key={statIndex} className="stat-item">
                                    <div className="stat-info">
                                        <p className="stat-name">{stat?.name.replaceAll('-', ' ')}</p>
                                        <p className="stat-value">{base_stat}</p>
                                    </div>
                                    <div className="stat-bar-container">
                                        <div 
                                            className="stat-bar" 
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            
            <div className="info-card">
                <div className="info-row">
                    <span className="info-label">Height</span>
                    <span>{height / 10} m</span>
                </div>
                <div className="info-row">
                    <span className="info-label">Abilities</span>
                    <div className="ability-list">
                        {abilities?.map((ab, index) => (
                            <span key={index} className="ability-item">
                                {ab.ability.name.replaceAll('-', ' ')}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
            
            <div className="sprite-variants">
                <h3 className="section-title">Sprite Variants</h3>
                <div className="sprite-grid">
                    {imgList.map((spriteKey, spriteIndex) => {
                        const spriteUrl = sprites[spriteKey];
                        return (
                            <img 
                                key={spriteIndex} 
                                className="sprite-img" 
                                src={spriteUrl} 
                                alt={`${name}-${spriteKey}`} 
                            />
                        );
                    })}
                </div>
            </div>
            
            <div className="moves-section">
                <div className="moves-header">
                    <h3 className="section-title">Moves</h3>
                    <div className="moves-count">
                        {moves?.length > 0 && (
                            <span>Total: {moves.length} moves</span>
                        )}
                    </div>
                </div>
                
                {moves && moves.length > 0 && (
                    <>
                        <div className="moves-tabs">
                            {Array.from({ length: totalMovesTabs }, (_, i) => (
                                <button
                                    key={i}
                                    className={`moves-tab ${activeMovesTab === i ? 'active' : ''}`}
                                    onClick={() => setActiveMovesTab(i)}
                                >
                                    {getTabLabel(i)}
                                </button>
                            ))}
                        </div>
                        
                        <div className="moves-grid">
                            {getCurrentPageMoves().map((moveObj, moveIndex) => {
                                // If this is a placeholder, render an empty div with the same styling
                                if (moveObj.isPlaceholder) {
                                    return (
                                        <div 
                                            key={`placeholder-${moveIndex}`}
                                            className="move-button move-placeholder"
                                        ></div>
                                    );
                                }
                                
                                const { move } = moveObj;
                                return (
                                    <button 
                                        className="move-button" 
                                        key={moveIndex} 
                                        onClick={() => fetchMoveData(move?.name, move?.url)}
                                    >
                                        {move?.name.replaceAll('-', ' ')}
                                    </button>
                                );
                            })}
                        </div>
                        
                        <div className="moves-pagination">
                            <button 
                                className="pagination-button"
                                disabled={activeMovesTab === 0}
                                onClick={() => setActiveMovesTab(prev => Math.max(0, prev - 1))}
                            >
                                Previous
                            </button>
                            <span className="pagination-info">
                                Page {activeMovesTab + 1} of {totalMovesTabs}
                            </span>
                            <button 
                                className="pagination-button"
                                disabled={activeMovesTab === totalMovesTabs - 1}
                                onClick={() => setActiveMovesTab(prev => Math.min(totalMovesTabs - 1, prev + 1))}
                            >
                                Next
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}