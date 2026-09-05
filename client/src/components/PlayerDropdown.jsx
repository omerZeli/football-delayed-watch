import { useMemo, useRef, useState } from "react";
import {
  Box,
  ButtonBase,
  InputAdornment,
  MenuItem,
  MenuList,
  Popover,
  TextField,
  Typography,
} from "@mui/material";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { colors } from "../theme.js";

/**
 * Themed player picker.
 *
 * Mirrors TeamDropdown: a custom pill-shaped trigger plus a controlled MUI
 * Popover (rather than MUI <Select>) so the menu is opaque, anchored under the
 * field, and has a themed scrollbar.
 *
 * Free text is supported: whatever you type can be used as the player, even if
 * it isn't in the preset list, via the "Search …" action or by pressing Enter.
 * This lets you search for any player, not just the suggested ones.
 *
 * `options` are the suggested players for the currently selected team. When
 * there is no selected team yet the picker is disabled.
 */
export default function PlayerDropdown({
  id,
  value,
  options = [],
  onChange,
  disabled = false,
  placeholder = "Select a player",
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const anchorRef = useRef(null);

  const query = search.trim();

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return options;
    return options.filter((player) => player.toLowerCase().includes(q));
  }, [options, query]);

  const exactMatch = useMemo(
    () => options.some((player) => player.toLowerCase() === query.toLowerCase()),
    [options, query]
  );

  const closeMenu = () => {
    setOpen(false);
    setSearch("");
  };

  const select = (player) => {
    onChange(player);
    closeMenu();
  };

  const commitFreeText = () => {
    if (!query) return;
    select(query);
  };

  return (
    <>
      <ButtonBase
        id={id}
        ref={anchorRef}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        focusRipple
        sx={{
          width: "100%",
          justifyContent: "space-between",
          gap: 1,
          borderRadius: 999,
          px: 2.4,
          py: 1.4,
          bgcolor: "rgba(0,0,0,0.28)",
          color: "text.primary",
          fontSize: "1.05rem",
          fontWeight: 600,
          textAlign: "left",
          border: `1px solid ${open ? colors.accent : colors.line}`,
          boxShadow: open ? "0 0 0 3px rgba(58,232,201,0.18)" : "none",
          opacity: disabled ? 0.5 : 1,
          transition: "border-color .2s ease, background .2s ease, box-shadow .2s ease",
          "&:hover": {
            bgcolor: "rgba(0,0,0,0.38)",
            borderColor: open ? colors.accent : "rgba(58,232,201,0.5)",
          },
        }}
      >
        <Box
          component="span"
          sx={{
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            color: value ? "text.primary" : "text.secondary",
          }}
        >
          {value || placeholder}
        </Box>
        <KeyboardArrowDownRoundedIcon
          sx={{
            color: colors.accent,
            transition: "transform .2s ease",
            transform: open ? "rotate(180deg)" : "none",
          }}
        />
      </ButtonBase>

      <Popover
        open={open}
        anchorEl={anchorRef.current}
        onClose={closeMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{
          paper: {
            sx: {
              // Match the trigger width.
              width: anchorRef.current ? anchorRef.current.offsetWidth : "auto",
              mt: 1,
              p: 0.5,
              // Solid, fully opaque background so nothing shows through.
              bgcolor: colors.menu,
              backgroundColor: colors.menu,
              backgroundImage: "none",
              border: `1px solid ${colors.line}`,
              borderRadius: 3,
              boxShadow: "0 12px 30px rgba(0,0,0,0.55)",
              overflow: "hidden",
            },
          },
        }}
      >
        {/* Pinned search field. */}
        <Box sx={{ p: 0.5, pb: 1 }}>
          <TextField
            size="small"
            autoFocus
            fullWidth
            placeholder="Search or type any player…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitFreeText();
              }
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon sx={{ color: colors.accent, fontSize: 20 }} />
                  </InputAdornment>
                ),
              },
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
        </Box>

        {/* Scrollable player list with a slim, themed scrollbar. */}
        <MenuList
          sx={{
            p: 0,
            maxHeight: 288,
            overflowY: "auto",
            scrollbarWidth: "thin",
            scrollbarColor: `rgba(58,232,201,0.45) transparent`,
            "&::-webkit-scrollbar": { width: 8 },
            "&::-webkit-scrollbar-track": { background: "transparent" },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "rgba(58,232,201,0.45)",
              borderRadius: 8,
              border: "2px solid transparent",
              backgroundClip: "content-box",
            },
            "&::-webkit-scrollbar-thumb:hover": {
              backgroundColor: "rgba(58,232,201,0.7)",
            },
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
          }}
        >
          {query && !exactMatch && (
            <MenuItem onClick={commitFreeText}>Search “{query}”</MenuItem>
          )}

          {filtered.map((player) => (
            <MenuItem
              key={player}
              selected={player === value}
              onClick={() => select(player)}
            >
              {player}
            </MenuItem>
          ))}

          {filtered.length === 0 && !query && (
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                No suggested players — type a name to search.
              </Typography>
            </Box>
          )}

          {filtered.length === 0 && query && exactMatch && (
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                No matching players
              </Typography>
            </Box>
          )}
        </MenuList>
      </Popover>
    </>
  );
}
