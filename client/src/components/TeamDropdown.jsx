import { useMemo, useState } from "react";
import {
  Box,
  InputAdornment,
  ListSubheader,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { colors } from "../theme.js";

/**
 * Themed team picker. Uses MUI Select so the open menu is fully styled
 * (no native OS highlight). Pill-shaped trigger with the name on the left
 * and a centered accent chevron on the right. The open menu has a search
 * field pinned to the top that filters the team list as you type.
 */
export default function TeamDropdown({ id, value, options, onChange }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter((team) => team.toLowerCase().includes(q));
  }, [options, search]);

  return (
    <Select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onClose={() => setSearch("")}
      IconComponent={KeyboardArrowDownRoundedIcon}
      MenuProps={{
        autoFocus: false,
        PaperProps: {
          sx: {
            mt: 1,
            p: 0.5,
            bgcolor: colors.menu,
            border: `1px solid ${colors.line}`,
            borderRadius: 3,
            backdropFilter: "blur(10px)",
            boxShadow: "0 12px 30px rgba(0,0,0,0.45)",
            "& .MuiMenuItem-root": {
              borderRadius: 1.5,
              fontWeight: 600,
              px: 2,
              py: 1,
              "&:hover": { bgcolor: "rgba(58,232,201,0.14)" },
              "&.Mui-selected, &.Mui-selected:hover": {
                bgcolor: colors.accent,
                color: "#10331f",
              },
            },
          },
        },
      }}
      sx={{
        width: "100%",
        borderRadius: 999,
        bgcolor: "rgba(0,0,0,0.28)",
        color: "text.primary",
        fontSize: "1.05rem",
        fontWeight: 600,
        transition: "border-color .2s ease, background .2s ease, box-shadow .2s ease",
        "& .MuiSelect-select": { py: 1.4, pl: 2.4 },
        "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.line },
        "&:hover": { bgcolor: "rgba(0,0,0,0.38)" },
        "&:hover .MuiOutlinedInput-notchedOutline": {
          borderColor: "rgba(58,232,201,0.5)",
        },
        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
          borderColor: colors.accent,
          borderWidth: 1,
          boxShadow: "0 0 0 3px rgba(58,232,201,0.18)",
        },
        "& .MuiSelect-icon": { color: colors.accent, right: 14 },
      }}
    >
      <ListSubheader
        sx={{
          p: 0.5,
          bgcolor: "transparent",
          lineHeight: 0,
        }}
      >
        <TextField
          size="small"
          autoFocus
          fullWidth
          placeholder="Search teams…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            // Stop Select's built-in type-ahead from hijacking keystrokes
            // (but let it close on Escape).
            if (e.key !== "Escape") e.stopPropagation();
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon sx={{ color: colors.accent, fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 999,
              bgcolor: "rgba(0,0,0,0.28)",
              color: "text.primary",
              fontWeight: 600,
              "& fieldset": { borderColor: colors.line },
              "&:hover fieldset": { borderColor: "rgba(58,232,201,0.5)" },
              "&.Mui-focused fieldset": { borderColor: colors.accent },
            },
          }}
        />
      </ListSubheader>

      {filtered.map((team) => (
        <MenuItem key={team} value={team}>
          {team}
        </MenuItem>
      ))}

      {filtered.length === 0 && (
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            No teams match “{search}”
          </Typography>
        </Box>
      )}
    </Select>
  );
}
