
## Overview
This document tracks the setup and configuration of the complete development environment for the Personal Investment Tracker project.

## Environment Components

### Core Development Stack
- **Editor**: Neovim (extended for web development)
- **Runtime**: Node.js (v18+)
- **Database**: PostgreSQL (v14+)
- **Containerization**: Docker & Docker Compose
- **Version Control**: Git (already configured)

### Additional Tools
- **API Testing**: Bruno or Postman
- **Database Management**: pgAdmin or DBeaver
- **Package Management**: npm/yarn
- **Process Management**: PM2 (for production)

## Setup Progress Tracker

### ✅ Phase 1: Neovim Web Development Extensions

**Status**: 🔄 In Progress

**Current State**: C/C++ focused configuration with LSP, Copilot, Telescope
**Target State**: Full-stack JavaScript development ready

#### Required Neovim Plugins
```lua
-- Add to lua/plugins/web-dev.lua (NEW FILE)
return {
  -- TypeScript/JavaScript LSP and tooling
  {
    "jose-elias-alvarez/null-ls.nvim",
    event = { "BufReadPre", "BufNewFile" },
    dependencies = { "nvim-lua/plenary.nvim" },
    config = function() require("config.null-ls") end,
  },

  -- Enhanced syntax highlighting
  {
    "nvim-treesitter/nvim-treesitter",
    build = ":TSUpdate",
    event = { "BufReadPost", "BufNewFile" },
    config = function() require("config.treesitter") end,
  },

  -- Auto-close HTML/JSX tags
  {
    "windwp/nvim-ts-autotag",
    dependencies = { "nvim-treesitter/nvim-treesitter" },
    config = function()
      require("nvim-ts-autotag").setup()
    end,
  },

  -- Bracket/quote auto-pairing
  {
    "windwp/nvim-autopairs",
    event = "InsertEnter",
    config = function()
      require("nvim-autopairs").setup({})
      -- Integration with nvim-cmp
      local cmp_autopairs = require("nvim-autopairs.completion.cmp")
      local cmp = require("cmp")
      cmp.event:on("confirm_done", cmp_autopairs.on_confirm_done())
    end,
  },

  -- Database interaction
  {
    "tpope/vim-dadbod",
    dependencies = {
      "kristijanhusak/vim-dadbod-ui",
      "kristijanhusak/vim-dadbod-completion",
    },
    config = function() require("config.dadbod") end,
    cmd = { "DBUI", "DB" },
  },

  -- Git integration
  {
    "lewis6991/gitsigns.nvim",
    event = { "BufReadPre", "BufNewFile" },
    config = function()
      require("gitsigns").setup()
    end,
  },

  -- File explorer
  {
    "nvim-tree/nvim-tree.lua",
    dependencies = { "nvim-tree/nvim-web-devicons" },
    config = function() require("config.nvim-tree") end,
    cmd = { "NvimTreeToggle", "NvimTreeFocus" },
  },
}
```

#### Required Configuration Files

**1. lua/config/null-ls.lua** (NEW FILE)
```lua
local null_ls = require("null-ls")

null_ls.setup({
  sources = {
    -- JavaScript/TypeScript
    null_ls.builtins.formatting.prettier.with({
      filetypes = { "javascript", "typescript", "json", "html", "css", "markdown", "yaml" },
    }),
    null_ls.builtins.diagnostics.eslint.with({
      condition = function(utils)
        return utils.root_has_file({ ".eslintrc.js", ".eslintrc.json", "eslint.config.js" })
      end,
    }),
    
    -- SQL formatting
    null_ls.builtins.formatting.sql_formatter,
    
    -- General
    null_ls.builtins.completion.spell,
  },
  on_attach = function(client, bufnr)
    if client.supports_method("textDocument/formatting") then
      vim.keymap.set("n", "<leader>f", function()
        vim.lsp.buf.format({ bufnr = bufnr })
      end, { buffer = bufnr, desc = "Format" })
    end
  end,
})
```

**2. lua/config/treesitter.lua** (NEW FILE)
```lua
require("nvim-treesitter.configs").setup({
  ensure_installed = {
    "javascript", "typescript", "tsx", "json", "html", "css", "sql",
    "lua", "vim", "markdown", "yaml", "dockerfile", "bash"
  },
  highlight = { enable = true },
  indent = { enable = true },
  autotag = { enable = true },
})
```

**3. lua/config/dadbod.lua** (NEW FILE)
```lua
-- Database UI configuration
vim.g.db_ui_use_nerd_fonts = 1
vim.g.db_ui_winwidth = 30

-- Key mappings for database work
vim.keymap.set("n", "<leader>db", ":DBUI<CR>", { desc = "Open Database UI" })
```

**4. lua/config/nvim-tree.lua** (NEW FILE)
```lua
require("nvim-tree").setup({
  git = { enable = true },
  renderer = {
    icons = {
      show = {
        file = true,
        folder = true,
        folder_arrow = true,
        git = true,
      },
    },
  },
})

vim.keymap.set("n", "<leader>e", ":NvimTreeToggle<CR>", { desc = "Toggle file explorer" })
```

#### LSP Configuration Updates
**Modify lua/config/lsp.lua** - Add these servers:
```lua
-- Add after existing LSP setups

-- TypeScript/JavaScript
lspconfig.tsserver.setup({
  on_attach = on_attach,
  capabilities = require("cmp_nvim_lsp").default_capabilities(),
})

-- JSON
lspconfig.jsonls.setup({
  on_attach = on_attach,
  capabilities = require("cmp_nvim_lsp").default_capabilities(),
})

-- HTML
lspconfig.html.setup({
  on_attach = on_attach,
  capabilities = require("cmp_nvim_lsp").default_capabilities(),
})

-- CSS
lspconfig.cssls.setup({
  on_attach = on_attach,
  capabilities = require("cmp_nvim_lsp").default_capabilities(),
})
```

#### Package Installation Required
```bash
# LSP servers
npm install -g typescript typescript-language-server
npm install -g vscode-langservers-extracted  # HTML, CSS, JSON
npm install -g sql-language-server

# Formatters and linters
npm install -g prettier eslint
```

**Action Items for Phase 1:**
- [ ] Create `lua/plugins/web-dev.lua` with above content
- [ ] Create configuration files in `lua/config/`
- [ ] Update `lua/config/lsp.lua` with web LSP servers
- [ ] Install required npm packages globally
- [ ] Test LSP functionality with sample JS/TS files
- [ ] Add web development keymaps to `lua/core/keymaps.lua`

---

### 🔄 Phase 2: Docker Development Environment

**Status**: ⏳ Pending

#### Docker Compose Setup
**File**: `docker-compose.dev.yml`
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: investment_tracker_dev
      POSTGRES_USER: dev_user
      POSTGRES_PASSWORD: dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init:/docker-entrypoint-initdb.d
    
  pgadmin:
    image: dpage/pgadmin4
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@localhost.com
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "8080:80"
    depends_on:
      - postgres

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

**Action Items for Phase 2:**
- [ ] Create Docker Compose configuration
- [ ] Set up database initialization scripts
- [ ] Configure PostgreSQL connection in Neovim
- [ ] Test database connectivity
- [ ] Create development database schema

---

### 🔄 Phase 3: Node.js Project Structure

**Status**: ⏳ Pending

#### Project Structure
```
investment-tracker/
├── frontend/                 # Next.js app
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── tsconfig.json
├── backend/                  # Express API
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
├── shared/                   # Shared types and utilities
│   ├── package.json
│   └── types/
├── database/
│   ├── migrations/
│   └── seeds/
└── package.json              # Workspace root
```

#### Package.json Workspace Setup
**Root package.json:**
```json
{
  "name": "investment-tracker",
  "version": "1.0.0",
  "private": true,
  "workspaces": ["frontend", "backend", "shared"],
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:frontend": "cd frontend && npm run dev",
    "dev:backend": "cd backend && npm run dev",
    "build": "npm run build:backend && npm run build:frontend",
    "test": "npm run test:backend && npm run test:frontend",
    "lint": "npm run lint:backend && npm run lint:frontend"
  },
  "devDependencies": {
    "concurrently": "^7.6.0",
    "@typescript-eslint/eslint-plugin": "^5.0.0",
    "@typescript-eslint/parser": "^5.0.0",
    "eslint": "^8.0.0",
    "prettier": "^2.8.0"
  }
}
```

**Action Items for Phase 3:**
- [ ] Initialize npm workspaces
- [ ] Set up TypeScript configurations
- [ ] Configure ESLint and Prettier
- [ ] Create basic project structure
- [ ] Set up development scripts

---

### 🔄 Phase 4: Testing Infrastructure

**Status**: ⏳ Pending

#### Testing Strategy Overview
- **Unit Tests**: Jest + Testing Library
- **Integration Tests**: Supertest for API
- **E2E Tests**: Playwright
- **Database Tests**: Test containers
- **Development**: Hot reload and watch modes

#### Testing Configuration Files

**Jest Configuration** (`jest.config.js`):
```javascript
module.exports = {
  projects: [
    {
      displayName: 'backend',
      testMatch: ['<rootDir>/backend/**/*.test.{js,ts}'],
      preset: 'ts-jest',
      testEnvironment: 'node',
    },
    {
      displayName: 'frontend',
      testMatch: ['<rootDir>/frontend/**/*.test.{js,ts,tsx}'],
      preset: 'next/jest',
      testEnvironment: 'jsdom',
    },
  ],
};
```

**Action Items for Phase 4:**
- [ ] Set up Jest configuration
- [ ] Configure Testing Library
- [ ] Set up Playwright for E2E tests
- [ ] Create test database setup
- [ ] Write example test cases
- [ ] Configure CI/CD testing pipeline

---

### 🔄 Phase 5: Development Tools & Workflow

**Status**: ⏳ Pending

#### Additional Development Tools
- **API Testing**: Bruno (open-source Postman alternative)
- **Database GUI**: DBeaver or pgAdmin
- **Git Hooks**: Husky for pre-commit hooks
- **Code Quality**: ESLint, Prettier, TypeScript strict mode

#### Development Scripts
```json
{
  "scripts": {
    "dev": "Start all services in development mode",
    "test:watch": "Run tests in watch mode",
    "test:coverage": "Generate test coverage reports",
    "lint:fix": "Auto-fix linting issues",
    "db:migrate": "Run database migrations",
    "db:seed": "Seed development database",
    "docker:up": "Start Docker development environment",
    "docker:down": "Stop Docker development environment"
  }
}
```

**Action Items for Phase 5:**
- [ ] Install and configure development tools
- [ ] Set up pre-commit hooks
- [ ] Create development workflow documentation
- [ ] Configure hot-reload for all services
- [ ] Set up debugging configurations

---

## Installation Priority

### Immediate (Week 1)
1. **Neovim Web Extensions** - Enable productive web development
2. **Docker Environment** - Consistent development setup
3. **Basic Project Structure** - Start coding foundation

### Short-term (Week 2-3)
1. **Testing Infrastructure** - Don't accumulate testing debt
2. **Development Workflow** - Efficient daily development

### Medium-term (Week 4+)
1. **Advanced Tooling** - Performance monitoring, advanced debugging
2. **CI/CD Pipeline** - Automated testing and deployment

## Success Criteria

### Phase 1 Complete When:
- [ ] Neovim provides full TypeScript/JavaScript support
- [ ] LSP working for all web technologies
- [ ] Code formatting and linting functional
- [ ] Database connectivity from editor working

### Environment Complete When:
- [ ] One-command start of full development stack
- [ ] Hot-reload working for frontend and backend
- [ ] Tests running in watch mode
- [ ] Database migrations and seeding automated
- [ ] All tools integrated and documented

## Notes & Troubleshooting

### Common Issues
- **LSP servers not starting**: Check npm global installation
- **Docker permission issues**: Add user to docker group
- **Port conflicts**: Ensure ports 3000, 5432, 8080 available
- **TypeScript errors**: Verify tsconfig.json configurations

### Performance Considerations
- **Neovim LSP memory usage**: Monitor with large TypeScript projects
- **Docker volume performance**: Use bind mounts for development
- **Test execution speed**: Use test.only during development

### Backup Strategy
- **Configuration backup**: All configs in version control
- **Database backup**: Regular pg_dump during development
- **Environment recovery**: Documented in this guide
