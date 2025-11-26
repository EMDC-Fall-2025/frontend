import { TextField, MenuItem } from "@mui/material";
import { useState } from "react";
import SearchIcon from '@mui/icons-material/Search';

interface SearchBarProps {
    judges: any[];
    onJudgeSelect?: (judge: any) => void;
}

const SearchBar = ({ judges = [], onJudgeSelect }: SearchBarProps) => {
    const [searchTerm, setSearchTerm] = useState("")
    const [showDropdown, setShowDropdown] = useState(false)
    
    const filteredJudges = judges.filter(judge =>
        `${judge.first_name} ${judge.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return (
        <div style={{ position: 'relative' }}>
            <TextField 
                fullWidth
                label="Search Judges"
                InputLabelProps={{
                    sx: { fontStyle: 'italic' , }
                    
                }}
                value={searchTerm}
                onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setShowDropdown(true)
                }}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)} //Hides dropdown when user clicks outside the search field
                InputProps={{
                    endAdornment: <SearchIcon />
                }}
            />
            {showDropdown && searchTerm && (
                <div 
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        backgroundColor: 'white',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        maxHeight: '200px',
                        overflow: 'auto',
                        zIndex: 1000
                    }}
                >
                    {filteredJudges.map((judge) => (
                        <MenuItem 
                            key={judge.id}
                            onClick={() => {
                                setSearchTerm(`${judge.last_name} ${judge.first_name}`)
                                setShowDropdown(false)
                                onJudgeSelect?.(judge)
                            }}
                        >
                            {judge.last_name} {judge.first_name} 
                        </MenuItem>
                    ))}
                </div>
            )}
        </div>
    )
}

export default SearchBar