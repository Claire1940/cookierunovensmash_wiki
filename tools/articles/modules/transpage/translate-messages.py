#!/usr/bin/env python3
"""
Messages Translation Script
Translates en.json to multiple languages

Usage:
    python translate-messages.py [--test] [--overwrite] [--lang es,pt,ru]
"""

import asyncio
import json
import os
import sys
import argparse
import aiohttp
from pathlib import Path
from typing import List

# Add the parent directory to Python path to import shared config
script_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(script_dir)
sys.path.insert(0, parent_dir)

# Import from same module directory
from translator import MessagesTranslator
from json_extractor import JSONValueExtractor


class MessagesTranslationManager:
    """Manager for batch translating messages files"""

    def __init__(self, config_path: str = None):
        """
        Initialize translation manager

        Args:
            config_path: Path to configuration file (defaults to transpage config)
        """
        if config_path is None:
            # First try to use transpage-specific config
            transpage_config = os.path.join(script_dir, 'transpage_config.json')

            if os.path.exists(transpage_config):
                config_path = transpage_config
            else:
                # Fallback to shared config from translate module
                # script_dir = tools/articles/modules/transpage
                # We need tools/articles/modules/translate/translate_config.json
                modules_dir = os.path.dirname(script_dir)  # tools/articles/modules
                translate_module_dir = os.path.join(modules_dir, 'translate')
                config_path = os.path.join(translate_module_dir, 'translate_config.json')

        self.config_path = config_path
        self.config = None
        self.translator = None
        self.messages_dir = None

    def load_config(self) -> bool:
        """Load configuration from JSON file"""
        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                self.config = json.load(f)
            print(f"[OK] Configuration loaded from {self.config_path}")
            return True
        except Exception as e:
            print(f"[FAIL] Error loading configuration: {str(e)}")
            return False

    def initialize(self) -> bool:
        """Initialize translator"""
        try:
            self.translator = MessagesTranslator(self.config)
            self.messages_dir = Path('src/locales/')
            print("[OK] Translator initialized")
            return True
        except Exception as e:
            print(f"[FAIL] Error initializing translator: {str(e)}")
            return False

    def read_english_messages(self) -> str:
        """
        Read English messages file

        Returns:
            JSON string of English messages
        """
        en_file = self.messages_dir / 'en.json'

        if not en_file.exists():
            print(f"[FAIL] English messages file not found: {en_file}")
            return None

        try:
            with open(en_file, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            print(f"[FAIL] Error reading English messages: {str(e)}")
            return None

    async def translate_all_messages(
        self,
        target_langs: List[str],
        overwrite: bool = False
    ):
        """
        Translate English messages to target languages

        Args:
            target_langs: List of target language codes
            overwrite: Whether to overwrite existing files
        """
        print("\n" + "=" * 60)
        print("[START] STARTING MESSAGES TRANSLATION")
        print("=" * 60 + "\n")

        print(f"[TARGET] Target languages: {', '.join(target_langs)}")

        # Check if value extraction mode is enabled
        use_value_extraction = self.config.get('use_value_extraction', True)
        print(f"[MODE] Translation mode: {'值抽取模式 (优化)' if use_value_extraction else '完整JSON模式'}\n")

        # Read English messages
        en_messages = self.read_english_messages()

        if not en_messages:
            print("[FAIL] Failed to read English messages")
            return

        print(f"[OK] English messages loaded ({len(en_messages)} characters)")

        # Parse JSON and extract values if using value extraction mode
        if use_value_extraction:
            try:
                en_messages_obj = json.loads(en_messages)
                extractor = JSONValueExtractor()
                values, structure_map = extractor.extract_values(en_messages_obj)
                print(f"[OK] Extracted {len(values)} values from JSON")
                print(f"[INFO] Content size reduced: {len(en_messages)} -> {sum(len(v) for v in values)} characters\n")
            except Exception as e:
                print(f"[WARN] Failed to extract values: {str(e)}")
                print(f"[WARN] Falling back to full JSON mode\n")
                use_value_extraction = False
                en_messages_obj = None
                extractor = None
                values = None
                structure_map = None
        else:
            en_messages_obj = None
            extractor = None
            values = None
            structure_map = None
            print()

        # Use default ClientSession
        async with aiohttp.ClientSession() as session:
            # Build translation tasks
            all_tasks = []

            print("[BUILD] Building translation tasks...")
            for lang in target_langs:
                output_path = self.messages_dir / f'{lang}.json'

                # Skip if exists and not overwrite
                if output_path.exists() and not overwrite:
                    print(f"  [SKIP] Skipping {lang}.json (already exists)")
                    continue

                # Create translation task based on mode
                if use_value_extraction:
                    # Use value extraction mode
                    task_info = {
                        'lang': lang,
                        'output_path': output_path,
                        'task': self._translate_with_value_extraction(
                            lang,
                            output_path,
                            session,
                            en_messages_obj,
                            extractor,
                            values,
                            structure_map
                        )
                    }
                else:
                    # Use full JSON mode
                    task_info = {
                        'lang': lang,
                        'output_path': output_path,
                        'task': self.translator.translate_and_save(
                            en_messages,
                            lang,
                            output_path,
                            session
                        )
                    }
                all_tasks.append(task_info)

            if not all_tasks:
                print("[OK] All messages already translated!")
                return

            print(f"[OK] Built {len(all_tasks)} translation tasks\n")

            # Execute tasks sequentially (avoid concurrent 429 rate limits)
            print(f"[EXEC] Executing {len(all_tasks)} translation tasks sequentially...\n")

            stats = {
                'total': len(all_tasks),
                'success': 0,
                'failed': 0
            }

            for task_info in all_tasks:
                lang = task_info['lang']
                try:
                    result = await task_info['task']
                    if result is True:
                        stats['success'] += 1
                    else:
                        stats['failed'] += 1
                except Exception as e:
                    print(f"  [FAIL] [{lang.upper()}] Exception: {type(e).__name__}: {e}")
                    stats['failed'] += 1
                # Delay between languages
                await asyncio.sleep(5)

        # Print summary
        print("\n" + "=" * 60)
        print("[STATS] TRANSLATION COMPLETE")
        print("=" * 60)
        print(f"Total tasks:      {stats['total']}")
        print(f"[OK] Successful:    {stats['success']}")
        print(f"[FAIL] Failed:        {stats['failed']}")
        if stats['total'] > 0:
            print(f"Success rate:     {stats['success'] / stats['total'] * 100:.1f}%")
        print("=" * 60 + "\n")

    @staticmethod
    def _split_values_into_chunks(values: List[str], num_chunks: int = 4) -> List[List[str]]:
        """Split values list into num_chunks roughly equal chunks"""
        chunk_size = len(values) // num_chunks
        remainder = len(values) % num_chunks
        chunks, start = [], 0
        for i in range(num_chunks):
            end = start + chunk_size + (1 if i < remainder else 0)
            chunks.append(values[start:end])
            start = end
        return chunks

    async def _translate_with_value_extraction(
        self,
        target_lang: str,
        output_path: Path,
        session: aiohttp.ClientSession,
        en_messages_obj: dict,
        extractor: JSONValueExtractor,
        values: List[str],
        structure_map: dict
    ) -> bool:
        """Translate using value extraction mode with chunked API calls"""
        NUM_CHUNKS = 8
        chunks = self._split_values_into_chunks(values, num_chunks=NUM_CHUNKS)
        print(f"  [{target_lang.upper()}] 分块: {len(chunks)} chunks, 总值: {len(values)}")

        # Translate all chunks in one batch
        BATCH_SIZE = 8

        async def _translate_chunk(i, chunk):
            chunk_chars = sum(len(v) for v in chunk)
            print(f"  [{target_lang.upper()}] Chunk {i+1}/{len(chunks)} ({len(chunk)} values, {chunk_chars} chars) started", flush=True)
            translated = await self.translator.translate_values_list(chunk, target_lang, session)
            if not translated:
                print(f"  [{target_lang.upper()}] Chunk {i+1}/{len(chunks)} FAILED - using original", flush=True)
                return chunk
            else:
                print(f"  [{target_lang.upper()}] Chunk {i+1}/{len(chunks)} OK", flush=True)
                return translated

        all_translated = []
        for batch_start in range(0, len(chunks), BATCH_SIZE):
            batch = list(enumerate(chunks))[batch_start:batch_start + BATCH_SIZE]
            batch_num = batch_start // BATCH_SIZE + 1
            print(f"  [{target_lang.upper()}] Batch {batch_num} ({len(batch)} chunks parallel)...", flush=True)
            batch_results = await asyncio.gather(*[_translate_chunk(i, c) for i, c in batch])
            for result in batch_results:
                all_translated.extend(result)
            if batch_start + BATCH_SIZE < len(chunks):
                await asyncio.sleep(3)  # delay between batches

        # Rebuild JSON with translated values
        try:
            translated_obj = extractor.rebuild_json(en_messages_obj, all_translated)
            output_path.parent.mkdir(parents=True, exist_ok=True)
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(translated_obj, f, indent=2, ensure_ascii=False)
            print(f"  [OK] [{target_lang.upper()}] 已保存 - {output_path.name}")
            return True
        except Exception as e:
            print(f"  [FAIL] [{target_lang.upper()}] 重组或保存失败: {str(e)}")
            return False


def main():
    """Main function"""
    parser = argparse.ArgumentParser(description='Translate messages to multiple languages')
    parser.add_argument('--overwrite', action='store_true', help='Overwrite existing translations')
    parser.add_argument('--lang', type=str, default=None, help='Target languages (comma-separated, e.g., es,pt,ru)')

    args = parser.parse_args()

    # Initialize manager
    manager = MessagesTranslationManager()

    if not manager.load_config():
        sys.exit(1)

    if not manager.initialize():
        sys.exit(1)

    # Determine target languages
    if args.lang:
        target_langs = [lang.strip() for lang in args.lang.split(',')]
    else:
        # Default: all languages from config
        target_langs = manager.config.get('languages', ['es', 'pt', 'ru'])

    print(f"[LANG] Target languages: {', '.join(target_langs)}")

    # Run translation
    asyncio.run(manager.translate_all_messages(
        target_langs=target_langs,
        overwrite=args.overwrite
    ))


if __name__ == '__main__':
    main()
