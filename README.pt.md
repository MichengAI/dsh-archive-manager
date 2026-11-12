<p align="center">
  <img src="assets/branding/dsh-banner-en.webp" alt="DSH Archive Manager" width="100%">
</p>

<div align="center">

  # DSH Archive Manager

  **Gerenciamento seguro de sessões arquivadas no DeepSeek Harness**

  [简体中文](README.zh-CN.md) · [English](README.en.md) · [日本語](README.ja.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

  [Histórico de alterações](CHANGELOG.md) · [Apache-2.0](LICENSE)

  [![Licença: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](LICENSE)
  [![Pacote npm](https://img.shields.io/npm/v/%40michengai%2Fdsh-archive-manager.svg?label=npm%20package)](https://www.npmjs.com/package/@michengai/dsh-archive-manager)
  [![Downloads npm](https://img.shields.io/npm/dt/%40michengai%2Fdsh-archive-manager.svg?label=npm%20downloads)](https://www.npmjs.com/package/@michengai/dsh-archive-manager)
  [![DSH Web Plugin](https://img.shields.io/badge/DSH%20Web-Plugin-0f766e.svg)](https://github.com/MichengAI/dsh-archive-manager)
  [![Compatível com DSH até 0.2.2-rc.2](https://img.shields.io/badge/DSH-up%20to%200.2.2--rc.2-2563eb.svg)](#instalação)
</div>

> DSH Archive Manager é um plugin mantido pela comunidade para o DeepSeek Harness (DSH), não sendo um produto oficial da DeepSeek AI.

Este documento refere-se à versão **1.3.2**. Consulte o [registro de alterações](CHANGELOG.md) para versões publicadas.

## Visão geral

Guarde conversas inativas e recupere-as quando precisar, mantendo sua lista diária de tarefas organizada.

- **Acesso duplo e painel amplo**: Gerencie sessões em **Configurações → Sessões arquivadas** ou ative o ícone na barra lateral principal para abrir um painel centralizado na área de trabalho.
- **Arquivamento e restauração**: Arquive conversas individuais, espaços de trabalho inteiros ou lotes entre projetos, e restaure ou abra sessões diretamente.
- **Busca em texto completo e pré-visualização rápida**: Pesquise simultaneamente em títulos e histórico de mensagens, combine filtros de projeto, favoritos e intervalo de datas com ordenação flexível, e visualize o contexto em Markdown ou texto destacado sem restaurar.
- **Favoritos e limpeza de inativos**: Marque conversas importantes com estrela e filtre por **Apenas favoritas**; pré-visualize e arquive conversas ociosas por dias de inatividade protegendo automaticamente tarefas em execução, interações pendentes e favoritas, com opção imediata de desfazer.
- **Ações na barra lateral e movimentação entre espaços**: Clique com o botão direito nas linhas de espaço de trabalho ou sessão na barra lateral para favoritar, arquivar, mover sessões padrão para outro espaço de trabalho ou copiar/abrir a pasta do projeto.
- **Limpeza de subagentes órfãos e exclusão permanente**: Detecte e remova subagentes residuais cuja sessão principal foi excluída externamente, e apague definitivamente sessões e registros indesejados após confirmação.
- **Multilíngue e pronto para proxy reverso**: Compatível com todos os 8 idiomas integrados do DeepSeek Harness, acompanha o tema claro/escuro e funciona atrás de proxies reversos com prefixo de caminho.

## Capturas de tela

### 1. Painel de gerenciamento de arquivos

Busque, marque como favorita, pré-visualize, restaure e limpe em **Configurações → Sessões arquivadas → Arquivadas**:

![Arquivadas: filtros compartilhados, favoritos e linhas compactas](assets/screenshots/archived-sessions.webp)

Alterne para **Não arquivadas** para pré-visualizar a limpeza de inativos ou arquivar por projeto:

![Não arquivadas: limpeza inteligente e arquivamento por projeto](assets/screenshots/unarchived-sessions.webp)

### 2. Painel principal da área de trabalho (atalho na barra lateral)

Com o atalho na barra lateral ativado, clique no ícone à esquerda para abrir a visualização completa:

![Painel principal: atalho dedicado na barra lateral](assets/screenshots/main-view-panel.webp)

### 3. Menus de contexto da barra lateral e movimentação

Clique com o botão direito em qualquer linha de espaço de trabalho ou sessão na barra lateral para ações rápidas e transferência entre projetos:

| Ações do espaço de trabalho (Copiar/Abrir pasta) | Mover sessão entre espaços |
| :---: | :---: |
| <img src="assets/screenshots/workspace-context-menu.webp" alt="Menu de ações do espaço de trabalho" width="100%"> | <img src="assets/screenshots/session-move-menu.webp" alt="Menu mover sessão" width="100%"> |

## Instalação

É necessário um ambiente DeepSeek Harness em funcionamento. Os exemplos abaixo usam o perfil `web`; ajuste conforme o seu ambiente.

- **Compatibilidade com o host**: Série DeepSeek Harness `0.2.x` (`>=0.2.0-rc.1 <0.3.0-0`), verificada em todas as versões candidatas `0.2.x` (`0.2.0-rc.1` até `0.2.2-rc.2`; versões alpha intermediárias não são suportadas).
- Hosts anteriores a `0.2.0-rc.1` não são mais suportados, e alterações incompatíveis da linha `0.3.0` são bloqueadas pela verificação de versão. Usuários em `0.1.x` devem instalar a versão `1.0.20`.
- **Suporte a proxy reverso**: Funciona atrás de proxies reversos com prefixo de caminho (ex.: `/app/dsh/`).

### Peça a um agente para instalar (recomendado)

Envie este comando para um agente com acesso ao terminal:

```text
Instale a versão mais recente do @michengai/dsh-archive-manager no meu perfil web do DSH usando o registro oficial do npm, verifique a ativação e explique como recarregar.
```

### Instalação manual e atualização

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

dsh plugin --profile web add @michengai/dsh-archive-manager@latest --registry=https://registry.npmjs.org/
```

Reinicie o DSH Web, faça uma atualização forçada no navegador (`Ctrl+Shift+R`) e abra **Configurações → Sessões arquivadas**. Para atualizar, execute o comando de instalação novamente.

## Configuração do plugin

Abra **Barra lateral → Plugins → `Archive Manager`** para configurar:

- **Localização do acesso (`entryLocation`)**
  - **Ambos (`both`)**: Exibe o ícone na barra lateral esquerda e mantém **Configurações → Sessões arquivadas**.
  - **Apenas barra lateral (`sidebar`)**: Exibe o ícone apenas na barra lateral esquerda e oculta a entrada nas Configurações.
  - **Apenas configurações (`settings`)** (Padrão): Mantém o acesso apenas em **Configurações → Sessões arquivadas**.
- **Estrela de favoritos na barra lateral (`sidebarFavoriteStar`)**
  - **Mostrar tudo (`all`)** (Padrão): Mostra a estrela nas linhas de sessão ao passar o mouse e nas sessões favoritas.
  - **Apenas favoritos (`favorites`)**: Mostra a estrela apenas nas sessões favoritas; oculta a estrela ao passar o mouse nas demais.
  - **Ocultar tudo (`none`)**: Oculta as estrelas na barra lateral (ainda é possível favoritar pelo menu de contexto e filtrar por **Apenas favoritas**).

## Guia de uso

| Ação | Como fazer |
| --- | --- |
| **Arquivar sessões** | Escolha **Arquivar sessão** no menu de contexto da barra lateral, ou selecione sessões em **Não arquivadas** para arquivar em lote |
| **Arquivar espaço / grupo** | Escolha **Arquivar espaço de trabalho** no menu do espaço, ou use o menu **…** de um grupo em **Não arquivadas** (ignora filtros de busca) |
| **Buscar e filtrar** | A busca cobre títulos e mensagens; combine **Apenas favoritas**, ordenação, projeto e intervalo de datas (calendário com predefinições e navegação por teclado) |
| **Pré-visualização rápida** | Clique em um trecho encontrado ou em **Mais ações → Pré-visualização rápida** para ver o contexto sem restaurar |
| **Visualizar ou restaurar** | Clique no título para ler e continuar conversando mantendo arquivada; clique em restaurar ou **Mais ações → Restaurar e abrir** |
| **Favoritar conversas** | Clique na estrela da linha ou use o menu de contexto, e filtre com **Apenas favoritas** |
| **Limpar conversas inativas** | Em **Não arquivadas**, defina os dias de ociosidade (1–36.500), visualize os candidatos e confirme; use **Desfazer este arquivamento** antes de fechar ou recarregar |
| **Mover entre espaços** | Clique com o botão direito em uma sessão padrão na barra lateral e escolha **Mover para espaço de trabalho** |
| **Limpar subagentes órfãos** | Quando subagentes cujas sessões principais foram excluídas externamente forem detectados, clique para limpar no painel organizador e liberar espaço |
| **Reconstruir cache de lista** | Quando faltarem entradas oficiais de cache, um cartão permitirá ler os registros em modo somente leitura e restaurar os títulos |
| **Exclusão permanente** | Selecione as sessões e clique em **Excluir** (ou pelo menu de contexto) para apagar registros e caches após confirmação |
| **Copiar ID da sessão** | Selecione **Copiar ID da sessão** no menu **Mais ações** |

### Notas

- **Favoritos e proteção de inativos**: Favoritos são armazenados pelo host e preservados ao arquivar ou restaurar. A limpeza de inativos exclui automaticamente favoritos, a sessão aberta, sessões em execução e interações pendentes; conversas favoritas ainda podem ser arquivadas manualmente. Não há arquivamento automático em segundo plano.
- **Escopo de busca**: A busca em texto cobre mensagens de usuário e assistente, excluindo saídas de ferramentas, anexos, raciocínio e mensagens de sistema. Não há índice persistente; em históricos grandes, filtre primeiro por projeto, data ou favoritos.
- **Ações em lote e desfazer**: Arquivamento, restauração e exclusão em lote continuam mesmo com falhas individuais e permitem repetir apenas os itens com erro. **Desfazer este arquivamento** só está disponível enquanto a página de gerenciamento permanecer aberta. A exclusão permanente não pode ser desfeita.

## Perguntas frequentes (FAQ)

### Por que o acesso não aparece após a instalação?

Reinicie o DSH Web, force a atualização no navegador (`Ctrl+Shift+R`) e confirme a instalação no perfil ativo. Se ainda não aparecer, execute o comando abaixo para verificar se `ui-workspace-archive-manager` está presente e se o `cordis.patch.yml` do perfil não está desativando `workspace`, `session-projection-cache` ou `ui-workspace`:

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

dsh --profile web --dump-config
```

### Qual a diferença entre arquivar e excluir permanentemente?

Arquivar guarda a conversa para que você possa restaurá-la quando quiser. **A exclusão permanente não pode ser desfeita** e apaga registros, caches e anexos da sessão (a pasta do seu projeto nunca é excluída). Sempre exige confirmação.

### Posso usar junto com o Codex UI ou outros plugins de arquivamento?

Sim. Funciona em conjunto com o [Codex UI](https://github.com/MichengAI/dsh-codex-ui), e caso outros plugins de arquivamento estejam instalados, cada um exibe sua própria entrada nas Configurações de forma independente.

Para outros problemas, abra uma [issue](https://github.com/MichengAI/dsh-archive-manager/issues) com as versões do DSH e do plugin, passos para reproduzir e detalhes do erro.

## Instalar a partir do código-fonte

<details>
<summary>Expandir para desenvolvimento ou testes de alterações não publicadas</summary>

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

git clone https://github.com/MichengAI/dsh-archive-manager.git
Set-Location .\dsh-archive-manager
pnpm install --frozen-lockfile
pnpm build
dsh plugin --profile web add .
```

Reinicie o DSH Web e atualize o navegador depois. Após editar arquivos em [src](src), execute `pnpm build` antes de fazer commit (verificações: `pnpm typecheck`, `pnpm test`, `pnpm verify`).

</details>

## Ecossistema de produtos DSH

Para uma bancada de trabalho no desktop, baixe o [DSH Codex Desktop](https://github.com/MichengAI/dsh-codex-desktop/releases). Em instalações existentes do [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness), você pode adicionar os plugins conforme necessário:

| Plugin | Funcionalidades principais |
| --- | --- |
| [Codex UI](https://github.com/MichengAI/dsh-codex-ui) | Organização de projetos, busca de tarefas e navegação no histórico do chat |
| [Agency Agents](https://github.com/MichengAI/dsh-agency-agents) | Escolha e ativação de agentes especialistas |
| [Skills Manager](https://github.com/MichengAI/dsh-skills-manager) | Descoberta, ativação, criação e importação de habilidades locais |
| [Archive Manager](https://github.com/MichengAI/dsh-archive-manager) | Busca, restauração e exclusão física de conversas arquivadas |
| [IM Connect](https://github.com/MichengAI/dsh-im-connect) | Envio de tarefas e recebimento de respostas via aplicativos de mensagens |
| [Automation](https://github.com/MichengAI/dsh-automation) | Agendamento de tarefas recorrentes e monitoramento de execuções |
| [BTW](https://github.com/MichengAI/dsh-btw) | Perguntas paralelas sem interromper a tarefa principal |
| [Simplify](https://github.com/MichengAI/dsh-simplify) | Uso do `/simplify` para refinar código alterado no Git |
| [PUA](https://github.com/MichengAI/dsh-pua) | Incentivo ao agente para diagnosticar causas de falha e verificar antes de concluir |
| [Code Review](https://github.com/MichengAI/dsh-code-review) | Revisão independente de código com `/review` na conversa atual |
| [Codex Pet](https://github.com/MichengAI/dsh-codex-pet) | Notificações e aprovação de ferramentas por meio de um pet de desktop |

## Licença

Distribuído sob a [Licença Apache 2.0](LICENSE).
